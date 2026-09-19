from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select
import json
import re
import urllib.request
import urllib.parse
from typing import List

from database import get_session
from models import (
    Learner, Utterance, ErrorTag, FingerprintSnapshot, RootCause,
    CreateSessionRequest, SessionResponse, UtteranceRequest, UtteranceResponse, FingerprintScores
)
from fingerprint import get_fingerprint_for_learner, should_trigger_practice_mode, get_top_root_cause
from tagger import tag_errors
from llm import get_ai_response

router = APIRouter()

@router.post("/session", response_model=SessionResponse)
def create_session(request: CreateSessionRequest, session: Session = Depends(get_session)):
    statement = select(Learner).where(Learner.name == request.name)
    learner = session.exec(statement).first()
    
    if not learner:
        learner = Learner(name=request.name)
        session.add(learner)
        session.commit()
        session.refresh(learner)
        
    return SessionResponse(
        id=learner.id,
        name=learner.name,
        session_count=learner.session_count
    )

@router.post("/utterance", response_model=UtteranceResponse)
def process_utterance(request: UtteranceRequest, session: Session = Depends(get_session)):
    learner = session.get(Learner, request.learner_id)
    if not learner:
        learner = Learner(id=request.learner_id, name="Learner")
        session.add(learner)
        session.commit()
        session.refresh(learner)
        
    # Get current fingerprint
    current_fingerprint = get_fingerprint_for_learner(learner.id, session)
    
    # Calculate utterance count for practice mode
    utterance_count = len(learner.utterances) + 1
    
    practice_mode = should_trigger_practice_mode(utterance_count, current_fingerprint)
    
    # LLM Call
    ai_resp = get_ai_response(request.raw_text, current_fingerprint, utterance_count, practice_mode)
    
    # Tag Errors
    tags_data = tag_errors(request.raw_text, ai_resp["corrected_text"])
    
    # Save Utterance
    utterance = Utterance(
        learner_id=learner.id,
        raw_text=request.raw_text,
        corrected_text=ai_resp["corrected_text"]
    )
    session.add(utterance)
    session.commit()
    session.refresh(utterance)
    
    # Save Tags
    root_cause_tags = []
    for t in tags_data:
        rc_enum = RootCause(t["root_cause"])
        tag = ErrorTag(
            utterance_id=utterance.id,
            root_cause=rc_enum,
            confidence=t["confidence"]
        )
        session.add(tag)
        root_cause_tags.append(rc_enum.value)
    
    session.commit()
    
    # Recompute and Save Fingerprint
    new_fingerprint = get_fingerprint_for_learner(learner.id, session)
    
    fp_snapshot = FingerprintSnapshot(
        learner_id=learner.id,
        scores=json.dumps(new_fingerprint)
    )
    session.add(fp_snapshot)
    session.commit()
    
    # If first utterance in a session, could bump session count.
    if utterance_count == 1:
        learner.session_count += 1
        session.commit()
        
    top_rc = get_top_root_cause(new_fingerprint)
    
    return UtteranceResponse(
        utterance_id=utterance.id,
        corrected_text=ai_resp["corrected_text"],
        tamil_response=ai_resp["tamil_response"],
        fingerprint=FingerprintScores(**new_fingerprint),
        root_cause_tags=root_cause_tags,
        top_root_cause=top_rc,
        practice_mode=practice_mode,
        practice_sentences=ai_resp["practice_sentences"]
    )

@router.get("/fingerprint/{learner_id}", response_model=FingerprintScores)
def get_fingerprint(learner_id: str, session: Session = Depends(get_session)):
    fp = get_fingerprint_for_learner(learner_id, session)
    return FingerprintScores(**fp)

@router.get("/history/{learner_id}")
def get_history(learner_id: str, session: Session = Depends(get_session)):
    statement = select(Utterance).where(Utterance.learner_id == learner_id).order_by(Utterance.timestamp.desc()).limit(20)
    utterances = session.exec(statement).all()
    
    history = []
    for u in utterances:
        tags = [{"root_cause": t.root_cause.value, "confidence": t.confidence} for t in u.error_tags]
        history.append({
            "id": u.id,
            "raw_text": u.raw_text,
            "corrected_text": u.corrected_text,
            "timestamp": u.timestamp,
            "tags": tags
        })
    return history

@router.get("/demo/sentences")
def get_demo_sentences():
    return [
        "Yesterday I go to market and buy two book.",
        "She is very good teacher and help me lot.",
        "I am study since morning, now I eat rice.",
        "He gave me the pen but I not yet use it.",
        "My sister she work in hospital as nurse."
    ]

@router.get("/tts")
def tts_stream(text: str, lang: str = "ta"):
    clean_text = re.sub(r'[*#_`~>]', '', text).strip()
    if not clean_text:
        return Response(content=b"", media_type="audio/mpeg")

    # Split long text into natural phrases (<= 130 chars) so Google TTS doesn't reject
    sentences = re.split(r'(?<=[.!?:\n])\s+', clean_text)
    chunks = []
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        if len(s) <= 130:
            chunks.append(s)
        else:
            words = s.split()
            cur = []
            cur_len = 0
            for w in words:
                if cur_len + len(w) + 1 > 130:
                    if cur:
                        chunks.append(" ".join(cur))
                    cur = [w]
                    cur_len = len(w)
                else:
                    cur.append(w)
                    cur_len += len(w) + 1
            if cur:
                chunks.append(" ".join(cur))

    combined = bytearray()
    tl_param = "ta" if lang.lower().startswith("ta") else "en-IN"
    for chunk in chunks:
        if not chunk.strip():
            continue
        try:
            url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={urllib.parse.quote(chunk)}&tl={tl_param}&client=tw-ob"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                combined.extend(resp.read())
        except Exception as e:
            print(f"[TTS Stream Error for chunk '{chunk}']: {e}")
            continue

    return Response(
        content=bytes(combined),
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Accept-Ranges": "bytes"
        }
    )


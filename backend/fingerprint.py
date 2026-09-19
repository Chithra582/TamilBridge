from typing import List, Dict, Any
from datetime import datetime
from sqlmodel import Session, select
from models import RootCause, ErrorTag, Utterance

def compute_fingerprint(recent_tags: List[Dict[str, Any]], window: int = 20) -> Dict[str, float]:
    """
    Weighted-coverage score per category:
    score = sum over errors: weight(recency) * confidence
    where recency_weight = 1.0 for most recent, decaying to 0.5 for oldest
    Returns dict with all 6 categories, scores 0-10 scale.
    """
    recent_tags = recent_tags[:window]
    
    scores = {cause.value: 0.0 for cause in RootCause}
    
    n = len(recent_tags)
    if n == 0:
        return scores
        
    # Find max possible score for normalization
    max_raw_score = 0
    for i in range(n):
        weight = 1.0 - (0.5 * (i / n)) if n > 1 else 1.0
        max_raw_score += weight * 1.0
        
    if max_raw_score == 0:
        return scores
        
    raw_scores = {cause.value: 0.0 for cause in RootCause}
    
    for i, tag in enumerate(recent_tags):
        weight = 1.0 - (0.5 * (i / n)) if n > 1 else 1.0
        rc = tag.get('root_cause')
        conf = tag.get('confidence', 0.0)
        if rc in raw_scores:
            raw_scores[rc] += weight * conf
            
    # Normalize to 0-10
    for rc in raw_scores:
        scores[rc] = round((raw_scores[rc] / max_raw_score) * 10.0, 2)
        
    return scores

def get_top_root_cause(scores: Dict[str, float]) -> str:
    top_cause = max(scores.items(), key=lambda x: x[1])
    if top_cause[1] > 0:
        return top_cause[0]
    return "none"

def should_trigger_practice_mode(utterance_count: int, scores: Dict[str, float]) -> bool:
    if utterance_count > 0 and utterance_count % 5 == 0:
        top_cause = get_top_root_cause(scores)
        if top_cause != "none" and scores.get(top_cause, 0) > 3.0:
            return True
    return False

def get_fingerprint_for_learner(learner_id: str, session: Session) -> Dict[str, float]:
    # Join ErrorTag with Utterance to get both columns in one query
    statement = (
        select(ErrorTag.root_cause, ErrorTag.confidence)
        .join(Utterance, ErrorTag.utterance_id == Utterance.id)
        .where(Utterance.learner_id == learner_id)
        .order_by(Utterance.timestamp.desc())
        .limit(20)
    )
    rows = session.exec(statement).all()

    tag_dicts = [
        {
            "root_cause": row[0].value if hasattr(row[0], "value") else str(row[0]),
            "confidence": float(row[1]),
        }
        for row in rows
    ]

    return compute_fingerprint(tag_dicts)

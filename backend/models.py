from enum import Enum
from typing import Optional, List, Dict
from datetime import datetime
from uuid import uuid4
from sqlmodel import SQLModel, Field, Relationship
from pydantic import BaseModel
import json

class RootCause(str, Enum):
    article_absence = "article_absence"
    tense_marking = "tense_marking"
    preposition_transfer = "preposition_transfer"
    word_order = "word_order"
    pluralization = "pluralization"
    gender_pronoun = "gender_pronoun"

class Learner(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    session_count: int = Field(default=0)
    
    utterances: List["Utterance"] = Relationship(back_populates="learner")
    fingerprints: List["FingerprintSnapshot"] = Relationship(back_populates="learner")

class Utterance(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    learner_id: str = Field(foreign_key="learner.id")
    raw_text: str
    corrected_text: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    learner: Optional[Learner] = Relationship(back_populates="utterances")
    error_tags: List["ErrorTag"] = Relationship(back_populates="utterance")

class ErrorTag(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    utterance_id: str = Field(foreign_key="utterance.id")
    root_cause: RootCause
    confidence: float
    
    utterance: Optional[Utterance] = Relationship(back_populates="error_tags")

class FingerprintSnapshot(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    learner_id: str = Field(foreign_key="learner.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    scores: str  # JSON-encoded dict
    
    learner: Optional[Learner] = Relationship(back_populates="fingerprints")
    
    @property
    def scores_dict(self) -> dict:
        try:
            return json.loads(self.scores)
        except (ValueError, TypeError):
            return {}

# Pydantic Models

class CreateSessionRequest(BaseModel):
    name: str

class SessionResponse(BaseModel):
    id: str
    name: str
    session_count: int

class UtteranceRequest(BaseModel):
    learner_id: str
    raw_text: str

class FingerprintScores(BaseModel):
    article_absence: float = 0.0
    tense_marking: float = 0.0
    preposition_transfer: float = 0.0
    word_order: float = 0.0
    pluralization: float = 0.0
    gender_pronoun: float = 0.0

class UtteranceResponse(BaseModel):
    utterance_id: str
    corrected_text: str
    tamil_response: str
    fingerprint: FingerprintScores
    root_cause_tags: List[str]
    top_root_cause: str
    practice_mode: bool
    practice_sentences: List[str]

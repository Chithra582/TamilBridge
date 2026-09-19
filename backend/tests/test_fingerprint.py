import pytest
from fingerprint import compute_fingerprint, get_top_root_cause, should_trigger_practice_mode
from models import RootCause

def test_compute_fingerprint():
    recent_tags = [
        {"root_cause": RootCause.article_absence.value, "confidence": 0.9, "timestamp": "2023-01-01"},
        {"root_cause": RootCause.tense_marking.value, "confidence": 0.8, "timestamp": "2023-01-02"},
        {"root_cause": RootCause.article_absence.value, "confidence": 0.85, "timestamp": "2023-01-03"},
    ]
    
    scores = compute_fingerprint(recent_tags)
    
    assert scores[RootCause.article_absence.value] > 0
    assert scores[RootCause.tense_marking.value] > 0
    assert scores[RootCause.pluralization.value] == 0.0
    
    # 0 to 10 scale
    for v in scores.values():
        assert 0.0 <= v <= 10.0

def test_get_top_root_cause():
    scores = {
        RootCause.article_absence.value: 2.5,
        RootCause.tense_marking.value: 8.2,
        RootCause.pluralization.value: 1.0,
    }
    
    top = get_top_root_cause(scores)
    assert top == RootCause.tense_marking.value
    
def test_get_top_root_cause_none():
    scores = {
        RootCause.article_absence.value: 0.0,
        RootCause.tense_marking.value: 0.0,
    }
    assert get_top_root_cause(scores) == "none"

def test_should_trigger_practice_mode():
    high_scores = {RootCause.article_absence.value: 5.0}
    low_scores = {RootCause.article_absence.value: 2.0}
    
    assert should_trigger_practice_mode(5, high_scores) is True
    assert should_trigger_practice_mode(10, high_scores) is True
    assert should_trigger_practice_mode(7, high_scores) is False
    assert should_trigger_practice_mode(5, low_scores) is False

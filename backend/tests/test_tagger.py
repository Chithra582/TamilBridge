import pytest
from tagger import tag_errors_rule_based
from models import RootCause

def get_causes(tags):
    return [t["root_cause"] for t in tags]

def test_article_absence():
    tags = tag_errors_rule_based("She is teacher", "She is a teacher")
    causes = get_causes(tags)
    assert RootCause.article_absence.value in causes

def test_tense_marking():
    tags = tag_errors_rule_based("Yesterday I go", "Yesterday I went")
    causes = get_causes(tags)
    assert RootCause.tense_marking.value in causes

def test_preposition_transfer():
    tags = tag_errors_rule_based("I go market", "I went to the market")
    causes = get_causes(tags)
    assert RootCause.preposition_transfer.value in causes

def test_pluralization():
    tags = tag_errors_rule_based("I have two book", "I have two books")
    causes = get_causes(tags)
    assert RootCause.pluralization.value in causes

def test_gender_pronoun():
    tags = tag_errors_rule_based("He help me", "She helped me")
    causes = get_causes(tags)
    assert RootCause.gender_pronoun.value in causes

def test_word_order():
    # Tamil SOV transfer: "Rice eating I am" → "I am eating rice" (6 tokens, heavy reorder)
    tags = tag_errors_rule_based("Rice eating I am going now", "I am going to eat rice now")
    causes = get_causes(tags)
    assert RootCause.word_order.value in causes


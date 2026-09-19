import re
import json
import os
import google.generativeai as genai
from typing import List, Dict, Any
from dotenv import load_dotenv
from models import RootCause

load_dotenv()

def tokenize(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r'\b\w+\b', text)]

def longest_common_subsequence(X: List[str], Y: List[str]) -> int:
    m = len(X)
    n = len(Y)
    L = [[0] * (n + 1) for i in range(m + 1)]
    for i in range(m + 1):
        for j in range(n + 1):
            if i == 0 or j == 0:
                L[i][j] = 0
            elif X[i - 1] == Y[j - 1]:
                L[i][j] = L[i - 1][j - 1] + 1
            else:
                L[i][j] = max(L[i - 1][j], L[i][j - 1])
    return L[m][n]

def tag_errors_rule_based(raw_text: str, corrected_text: str) -> List[Dict[str, Any]]:
    tags = []
    raw_tokens = tokenize(raw_text)
    corrected_tokens = tokenize(corrected_text)
    
    # 1. article_absence
    articles = {'a', 'an', 'the'}
    raw_articles = [t for t in raw_tokens if t in articles]
    corr_articles = [t for t in corrected_tokens if t in articles]
    if len(corr_articles) > len(raw_articles):
        tags.append({
            "root_cause": RootCause.article_absence.value,
            "confidence": 0.85,
            "evidence": "Missing article added in correction."
        })
        
    # 2. tense_marking
    time_adverbs = {'yesterday', 'last', 'ago', 'earlier', 'tomorrow', 'next', 'soon', 'now', 'currently'}
    has_time_adverb = any(adv in raw_tokens for adv in time_adverbs)
    if has_time_adverb:
        # Simplistic check: if time adverb is present but texts differ, assume tense issue
        # Usually requires POS tagging for base-verb form check, using basic diff for now
        if len(set(raw_tokens) ^ set(corrected_tokens)) > 0:
            tags.append({
                "root_cause": RootCause.tense_marking.value,
                "confidence": 0.80,
                "evidence": "Time adverb present with potential verb mismatch."
            })
            
    # 3. preposition_transfer
    prepositions = {'to', 'at', 'in', 'on', 'for', 'with', 'from', 'of', 'about'}
    raw_preps = [t for t in raw_tokens if t in prepositions]
    corr_preps = [t for t in corrected_tokens if t in prepositions]
    if set(corr_preps) != set(raw_preps) or len(corr_preps) != len(raw_preps):
        tags.append({
            "root_cause": RootCause.preposition_transfer.value,
            "confidence": 0.75,
            "evidence": "Preposition difference between raw and corrected."
        })
        
    # 4. word_order
    if len(raw_tokens) > 4 and len(corrected_tokens) > 0:
        lcs_len = longest_common_subsequence(raw_tokens, corrected_tokens)
        lcs_ratio = lcs_len / max(len(raw_tokens), len(corrected_tokens))
        if lcs_ratio < 0.6:
            tags.append({
                "root_cause": RootCause.word_order.value,
                "confidence": 0.70,
                "evidence": f"Low LCS ratio: {lcs_ratio:.2f}"
            })
            
    # 5. pluralization
    numerals = {'2', '3', '4', '5', '6', '7', '8', '9', '10', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'many', 'several'}
    has_numeral = any(num in raw_tokens for num in numerals)
    raw_s = any(t.endswith('s') and len(t) > 3 for t in raw_tokens)
    corr_s = any(t.endswith('s') and len(t) > 3 for t in corrected_tokens)
    if has_numeral and corr_s and not raw_s:
        tags.append({
            "root_cause": RootCause.pluralization.value,
            "confidence": 0.85,
            "evidence": "Plural 's' missing after a numeral."
        })
        
    # 6. gender_pronoun
    pronouns = {'he', 'she', 'his', 'her', 'him'}
    raw_pronouns = [t for t in raw_tokens if t in pronouns]
    corr_pronouns = [t for t in corrected_tokens if t in pronouns]
    if raw_pronouns != corr_pronouns and set(raw_pronouns) & set(corr_pronouns) != set(corr_pronouns):
        tags.append({
            "root_cause": RootCause.gender_pronoun.value,
            "confidence": 0.90,
            "evidence": "Mismatch in gender pronouns."
        })

    return tags

def tag_errors_llm(raw_text: str, corrected_text: str) -> List[Dict[str, Any]]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return []
    models_to_try = [
        os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest"
    ]
    seen = set()
    unique_models = [m for m in models_to_try if not (m in seen or seen.add(m))]
    
    prompt = f'''
You are a grammar classification assistant. Given an original English sentence with errors and its corrected version, classify the error(s) into one or more of these 6 categories:
article_absence, tense_marking, preposition_transfer, word_order, pluralization, gender_pronoun.

Return JSON ONLY in this format:
[{{
    "root_cause": "category_name",
    "confidence": 0.0 to 1.0,
    "evidence": "brief explanation"
}}]

Original: "{raw_text}"
Corrected: "{corrected_text}"
'''
    try:
        response_text = None
        for m in unique_models:
            try:
                model = genai.GenerativeModel(m)
                response = model.generate_content(prompt)
                if response and response.text:
                    response_text = response.text
                    break
            except Exception:
                continue
        if not response_text:
            return []
        text = response_text.strip()
        json_start = text.find("[")
        json_end = text.rfind("]")
        if json_start != -1 and json_end != -1:
            clean_json = text[json_start:json_end+1]
        else:
            clean_json = text
        data = json.loads(clean_json)
        return data
    except Exception as e:
        print(f"[Gemini Error in tag_errors_llm]: {e}")
        return []

def tag_errors(raw_text: str, corrected_text: str) -> List[Dict[str, Any]]:
    rule_tags = tag_errors_rule_based(raw_text, corrected_text)
    
    needs_llm = False
    if not rule_tags:
        needs_llm = True
    elif all(tag['confidence'] < 0.6 for tag in rule_tags):
        needs_llm = True
        
    merged = {t['root_cause']: t for t in rule_tags}
        
    if needs_llm:
        llm_tags = tag_errors_llm(raw_text, corrected_text)
        for tag in llm_tags:
            rc = tag.get('root_cause')
            if rc in RootCause.__members__:
                if rc not in merged or tag.get('confidence', 0) > merged[rc]['confidence']:
                    merged[rc] = tag
                    
    result = list(merged.values())
    result.sort(key=lambda x: x['confidence'], reverse=True)
    return result

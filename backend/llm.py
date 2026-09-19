import os
import json
import google.generativeai as genai
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are "TamilBridge," a warm, patient bilingual English teacher for Tamil speakers.
You have access to the learner's current Error Fingerprint — a ranked list of their root-cause grammar weaknesses.

Your rules:
1. Always respond primarily in Tamil script. English content itself (target words/sentences) stays in English.
2. When correcting a mistake, silently map it to one of: Article Absence, Tense Marking Gap, Preposition Transfer, Word-Order Calque, Pluralization Skip, Gender/Pronoun Simplification.
3. If this mistake's root cause matches the learner's current #1 or #2 weakness on their fingerprint, explicitly say so in Tamil: e.g., "இது உங்க பொதுவான 'article' பிரச்சனை தான்" — connecting today's mistake to their known pattern.
4. Keep tone warm, informal, encouraging — like a tuition teacher, not clinical.
5. Never mention you are an AI. Stay in character as TamilBridge.
6. Structure your response as JSON with fields: corrected_text (str), tamil_response (str), practice_sentences (list of 3 str, only if practice_mode=true, else empty list)."""

def get_gemini_client() -> genai.GenerativeModel:
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    return genai.GenerativeModel(model_name)

def get_ai_response(raw_text: str, fingerprint: Dict[str, float], utterance_count: int, practice_mode: bool) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {
            "corrected_text": raw_text,
            "tamil_response": "API Key இல்லை.",
            "practice_sentences": []
        }
        
    model = get_gemini_client()
    
    user_msg = f"""Learner's Input: "{raw_text}"
Learner's Error Fingerprint: {json.dumps(fingerprint)}
Practice Mode Active: {str(practice_mode).lower()}

Analyze the input and provide the JSON response based on the system rules. If practice_mode is true, provide 3 practice sentences targeting their top weakness.
"""
    
    try:
        response = model.generate_content([SYSTEM_PROMPT, user_msg])
        text = response.text
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        data = json.loads(text.strip())
        return {
            "corrected_text": data.get("corrected_text", raw_text),
            "tamil_response": data.get("tamil_response", ""),
            "practice_sentences": data.get("practice_sentences", [])
        }
    except Exception as e:
        print(f"[Gemini Error in get_ai_response]: {e}")
        return {
            "corrected_text": raw_text,
            "tamil_response": "Sorry, an error occurred processing your request.",
            "practice_sentences": []
        }

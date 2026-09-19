# TamilBridge 2.0 — Contrastive Interference Engine

> **AI English teacher for Tamil speakers that diagnoses root-cause grammar patterns, not just surface mistakes.**

---

## What Makes This Different

Most language apps treat every mistake as independent. TamilBridge builds an **Error Fingerprint** — a radar chart tracking 6 grammatical root-cause categories — and mathematically identifies the single concept driving *multiple* surface mistakes. One targeted Tamil-language lesson collapses 10 scattered corrections into 1 fix.

### The 6 Root-Cause Categories

| Category | What it catches |
|---|---|
| **Article Absence** | Missing a/an/the (Tamil has no articles) |
| **Tense Marking Gap** | Verb tense mismatch with time adverbs |
| **Preposition Transfer** | Wrong/missing prepositions (Tamil uses postpositions) |
| **Word-Order Calque** | SOV word order transferred to English (SVO) |
| **Pluralization Skip** | Numeral + singular noun errors |
| **Gender/Pronoun Simplification** | he/she/his/her confusion |

---

## Architecture

```
Browser (React + Vite)
  ├── 🎤 Web Speech API (STT)
  ├── 📊 Radar Chart — live fingerprint visualization  
  ├── 💬 Chat UI — Tamil response display
  └── 🔊 Web Speech API TTS (Tamil voice)

        ↕ REST API (FastAPI)

Backend (Python)
  ├── Grammar Error Tagger  ← rule-based heuristics + LLM fallback
  ├── Fingerprint Scorer    ← weighted-coverage algorithm
  ├── Gemini LLM            ← fingerprint-aware Tamil teacher prompt
  └── SQLite DB             ← Learner / Utterance / ErrorTag / Snapshot
```

---

## Project Structure

```
TamilBridge/
├── backend/
│   ├── main.py           # FastAPI app entry
│   ├── models.py         # SQLModel tables + Pydantic schemas
│   ├── database.py       # SQLite engine + session
│   ├── tagger.py         # ★ Rule-based + LLM error tagger (6 categories)
│   ├── fingerprint.py    # ★ Weighted-coverage scoring algorithm
│   ├── llm.py            # Gemini fingerprint-aware system prompt
│   ├── routes.py         # REST endpoints
│   ├── requirements.txt
│   ├── .env.example      # → copy to .env and add GEMINI_API_KEY
│   └── tests/
│       ├── test_tagger.py
│       └── test_fingerprint.py
├── frontend/
│   ├── src/
│   │   ├── App.tsx                        # Two-column layout + session state
│   │   ├── components/
│   │   │   ├── FingerprintChart.tsx       # Live radar chart (Chart.js)
│   │   │   ├── ChatPanel.tsx              # STT/TTS/Demo Mode
│   │   │   ├── RootCauseInsight.tsx       # #1 weakness card (Tamil labels)
│   │   │   └── PracticeMode.tsx           # Targeted drill overlay
│   │   ├── hooks/useSpeech.ts             # Web Speech API hook
│   │   ├── api/client.ts                  # Typed fetch wrapper
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts    # proxies /api → localhost:8000
└── DEMO_SCRIPT.md        # Pre-scripted 5-sentence hackathon demo
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- A **Gemini API key** (free at [aistudio.google.com](https://aistudio.google.com))

### Backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Set your API key
copy .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_key_here

python main.py
# → Running on http://localhost:8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
# → Running on http://localhost:5173
```

Open **http://localhost:5173**, enter your name, and start speaking.

---

## Running Tests

```powershell
cd backend
venv\Scripts\activate
python -m pytest tests/ -v
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/session` | Create/get learner session |
| `POST` | `/api/utterance` | Process spoken sentence → tag errors → update fingerprint → AI response |
| `GET` | `/api/fingerprint/{id}` | Current fingerprint scores |
| `GET` | `/api/history/{id}` | Recent utterances with tags |
| `GET` | `/api/demo/sentences` | 5 pre-scripted demo sentences |

---

## The Algorithm (fingerprint scoring)

```python
# coverage_score = (recency_weight × confidence) summed per category
# recency_weight decays from 1.0 (most recent) to 0.5 (oldest in 20-utterance window)
# Normalized to 0–10 scale
# Recomputed after every utterance
```

Every 5 utterances, if the top root-cause score exceeds 3.0, the AI pauses free conversation and delivers a targeted mini-lesson for that one category.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
| `DATABASE_URL` | Optional | SQLite path (default: `sqlite:///./tamilbridge.db`) |

---

## Hackathon Demo

See **[DEMO_SCRIPT.md](./DEMO_SCRIPT.md)** for the pre-scripted 5-sentence demo sequence with expected fingerprint evolution, judge talking points, and Q&A prep.

Use the **🎬 Demo Mode** button in the UI to auto-play all 5 sentences without depending on live microphone input.

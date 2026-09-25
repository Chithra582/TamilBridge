# EXPLAINABILITY — TamilBridge Agent

> **Admissibility & Transparency Report for OpenGAP / Agent Passport**  
> *Agent Name:* TamilBridge Agent (`tamilbridge-agent`)  
> *Specification:* OpenGAP v0.1.0  
> *Domain:* Education / Contrastive Linguistics & Multilingual Learning AI  

---

## 1. Overview & Pedagogical Purpose

TamilBridge Agent is an autonomous language learning and diagnostic intelligence engineered specifically for native Tamil speakers acquiring English proficiency. Operating on a hybrid Python/FastAPI backend, rule-based linguistic taggers, radar-chart error fingerprint algorithms, and Google Gemini (`gemini-2.0-flash`), the platform diagnoses deep structural L1-to-L2 interference patterns.

The agent's primary purpose is to move beyond superficial spell-checking by addressing the foundational cognitive models driving learner errors. By classifying spoken or written utterances across six distinct contrastive interference categories, the agent synthesizes culturally resonant, bilingual Tamil-English mini-lessons that accelerate fluency.

---

## 2. How the Agent Decides (Decision-Making Logic)

TamilBridge Agent operates across a deterministic, four-stage pedagogical pipeline:

```
[Spoken / Typed English Utterance] ──> [Contrastive Grammar Tagger] ──> [Fingerprint Scorer & Radar Matrix]
                                                                                            │
                                                                                            ▼
[Bilingual Lesson & Audio TTS] <── [Grounded Pedagogical Gate] <── [Dominant Root-Cause Classifier]
```

### 2.1 Ingestion & Utterance Normalization
- **Decision:** Parses raw text or transcribed audio (via Web Speech API STT) into clean grammatical tokens.
- **Rules:**
  - Preserves verbatim syntax while normalizing casing and non-standard spacing.
  - Generates token sequences, part-of-speech (POS) tags, and dependency parse trees.

### 2.2 Contrastive Error Tagging Engine
- **Decision:** Classifies grammatical anomalies into 6 root-cause linguistic interference buckets:
  1. **Article Absence**: Omission of *a/an/the* caused by Tamil's lack of grammatical articles (e.g., *"I bought car"*).
  2. **Tense Marking Gap**: Verb tense mismatch with temporal adverbs (e.g., *"Yesterday I go there"*).
  3. **Preposition Transfer**: Inappropriate preposition choice or omission due to Tamil case suffixes and postpositions (e.g., *"He discussed about the topic"*).
  4. **Word-Order Calque**: Direct transfer of Tamil SOV (Subject-Object-Verb) order into English SVO structure.
  5. **Pluralization Skip**: Singular noun following plural numerals (e.g., *"two book"*), reflecting colloquial Tamil usage.
  6. **Gender/Pronoun Simplification**: Confusion between *he/she* or third-person objective pronouns.
- **Mechanism:** Applies high-precision regex/POS heuristics with LLM fallback for ambiguous syntactic constructions.

### 2.3 Weighted-Coverage Fingerprint Scoring
- **Decision:** Maintains a running 6-dimensional error vector for each learner.
- **Rules:**
  - Calculates category error frequency over time using an exponential decay moving average.
  - Normalizes scores into a 0–100 radar chart fingerprint.
  - Selects the dominant root-cause category having the highest severity weight for immediate remedial intervention.

### 2.4 Grounded Bilingual Lesson Generation
- **Decision:** Constructs a concise, 2-to-3 sentence explanation delivered in Tamil with English examples.
- **Rules:**
  - Structure: (1) Acknowledge the Tamil cognitive logic, (2) Explain the English structural rule, and (3) Provide a corrected parallel sentence.
  - Feeds Tamil response to browser Web Speech API TTS for synchronized audio delivery.

---

## 3. Data Sources & Inputs Used

| Data Input | Source | Purpose | Data Handling & Privacy |
|---|---|---|---|
| **Learner Utterances** | Web Speech API STT / Text input | Linguistic source text for grammar and interference analysis | Ephemeral memory processing; deleted after tag computation |
| **Error Fingerprint Vector** | SQLite DB (`Snapshot` table) | Longitudinal tracking of 6 grammatical interference categories | Stored locally in learner session; not shared externally |
| **Contrastive Rule Base** | `tagger.py` heuristics module | Hardcoded linguistic patterns comparing Tamil and English grammar | Immutable application codebase |
| **Pedagogical Prompts** | `llm.py` Gemini system instruction | Guides bilingual lesson generation and ensures non-judgmental tone | Immutable server configuration |

TamilBridge Agent complies with privacy-by-design standards:
- **No Personal Identifiers:** Learners practice without mandatory personal names, phone numbers, or institutional IDs.
- **Stateless Inference:** Gemini API calls specify `store: false` to ensure student utterances are not retained on external servers.
- **FERPA & GDPR Alignment:** Academic performance records are strictly partitioned and local to the user session.

---

## 4. Known Limitations & Failure Modes

Reviewers, educators, and learners should note the following system boundaries:

1. **Acoustic Background Noise in Speech Recognition:**
   - *Limitation:* Heavy ambient classroom chatter or low-quality laptop microphones can introduce STT transcription errors before grammar analysis.
   - *Mitigation:* The system displays the real-time transcript and allows one-click text editing before triggering analysis.

2. **Highly Colloquial "Tanglish" / Code-Switching:**
   - *Limitation:* Utterances that heavily mix Tamil vocabulary in Latin script (e.g., *"naan inniku college ponen"*) are outside standard English interference tagging.
   - *Mitigation:* The agent detects non-English tokens and gently prompts the learner to speak in full English sentences.

3. **Complex Literary Inversions:**
   - *Limitation:* Advanced poetic inversions or rhetorical questions may be misidentified as SOV word-order calques.
   - *Mitigation:* Tagger heuristics focus strictly on conversational and expository sentence structures.

4. **Non-Disability Diagnostic Boundary:**
   - *Limitation:* The agent diagnoses cross-linguistic interference, not clinical speech disorders or learning disabilities.
   - *Mitigation:* All feedback focuses on language acquisition techniques; no clinical claims are made.

---

## 5. Verification, Safety & Human Oversight

- **Side-by-Side Dual-Pane UI:** Learners see their original sentence, detected error tags, and corrected version simultaneously for clear visual verification.
- **Empirical Radar Telemetry:** Error rates and progress are quantitatively tracked on a 6-axis radar visualization.
- **Teacher Customization Controls:** Educators can manually adjust error sensitivity thresholds, review session histories, and select target focus categories.
- **Kill Switch:** Backend FastAPI workers and assistant threads can be paused or reset instantly without data side effects.

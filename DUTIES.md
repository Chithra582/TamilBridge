# Segregation of Duties (SOD): TamilBridge Agent

To ensure pedagogical precision, objective evaluation, and student privacy, responsibilities are segmented into four discrete roles.

## Role Allocations

```
[Utterance Ingestor]    --> Role: Speech/Text Normalizer & POS Parser (Maker)
        │
[Grammar Error Tagger]  --> Role: Contrastive Interference Classifier (Executor)
        │
[Fingerprint Scorer]    --> Role: Radar Matrix & Dominant Root Auditor (Checker)
        │
[Pedagogical Mentor]    --> Role: Bilingual Lesson & Audio Synthesizer (Auditor)
```

### 1. Utterance Ingestor (`maker`)
- Ingests transcribed speech and text inputs, cleans token sequences, generates POS tags, and normalizes sentence structures.

### 2. Grammar Error Tagger (`executor`)
- Evaluates token streams against the 6 contrastive interference categories and flags specific linguistic errors.

### 3. Fingerprint Scorer (`checker`)
- Updates the learner's 6-dimensional error fingerprint, computes moving averages, and identifies the dominant root cause.

### 4. Pedagogical Mentor (`auditor`)
- Formulates concise Tamil-language explanations, validates non-judgmental tone, and synthesizes audio feedback.

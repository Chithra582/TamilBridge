# TamilBridge 2.0 — Hackathon Demo Script

> **Run this BEFORE the demo:** Start backend (`uvicorn main:app --reload`) and frontend (`npm run dev`), open browser to `http://localhost:5173`, enter name "Demo Learner". Use the **🎬 Demo Mode** button to auto-play sentences — or type them manually if mic is unreliable.

---

## The Story Arc

> *"This is a new learner. No mistakes yet — the fingerprint is completely flat. Watch what happens as they speak."*

---

## Sentence 1

**Input:** `Yesterday I go to market and buy two book.`

| Expected Tags | Why |
|---|---|
| `tense_marking` (0.80) | "yesterday" + present-tense "go/buy" |
| `article_absence` (0.85) | missing "the" before "market" |
| `pluralization` (0.85) | "two book" → "two books" |

**Expected corrected:** `Yesterday I went to the market and bought two books.`

**Fingerprint after Sentence 1:**
- Article Absence: ~3.5 | Tense Marking: ~3.2 | Pluralization: ~3.5

**🎤 Say to judges:** *"Three different-looking mistakes — but notice: the chart already shows two big spikes. The system isn't seeing 3 errors; it's seeing 2 structural patterns."*

---

## Sentence 2

**Input:** `She is very good teacher and help me lot.`

| Expected Tags | Why |
|---|---|
| `article_absence` (0.85) | "a good teacher" — missing "a" |
| `tense_marking` (0.80) | "help" → "helps" |

**Expected corrected:** `She is a very good teacher and helps me a lot.`

**Fingerprint after Sentence 2:**
- **Article Absence: ~5.8** ← growing spike | Tense Marking: ~4.5

**🎤 Say to judges:** *"Second sentence. The AI said in Tamil: 'இது உங்க பொதுவான article பிரச்சனை தான்' — connecting today's mistake to the learner's known pattern."*

---

## Sentence 3

**Input:** `I am study since morning, now I eat rice.`

| Expected Tags | Why |
|---|---|
| `tense_marking` (0.85) | "am study" → "have been studying"; "eat" → "am eating" |
| `word_order` (0.70) | restructured sentence |

**Expected corrected:** `I have been studying since morning; now I am eating rice.`

**Fingerprint after Sentence 3:**
- Article Absence: ~5.2 | **Tense Marking: ~6.1** ← chasing Article Absence | Word Order: ~1.5

**🎤 Say to judges:** *"Tense Marking is now neck and neck. The system continuously re-ranks using a recency-weighted algorithm — not just a count."*

---

## Sentence 4

**Input:** `He gave me the pen but I not yet use it.`

| Expected Tags | Why |
|---|---|
| `tense_marking` (0.80) | "not yet use" → "haven't used yet" |

**Expected corrected:** `He gave me the pen but I haven't used it yet.`

**Fingerprint after Sentence 4:**
- **Tense Marking: ~7.4** ← #1 spike | Article Absence: ~4.8

**🎤 Say to judges:** *"Four sentences in, clear diagnosis. Tense Marking is the dominant root cause — 3 separate surface mistakes all trace back to it."*

---

## Sentence 5 — The Payoff

**Input:** `My sister she work in hospital as nurse.`

| Expected Tags | Why |
|---|---|
| `article_absence` (0.85) | "a nurse" / "a hospital" — missing "a" |
| `tense_marking` (0.80) | "she work" → "she works" |
| `gender_pronoun` (0.70) | "My sister she" — redundant pronoun (Tamil transfer) |

**Expected corrected:** `My sister works in a hospital as a nurse.`

**Final Fingerprint:** Tense Marking: ~8.2 | Article Absence: ~6.1 | Gender/Pronoun: ~1.5

---

## The Root-Cause Reveal Moment

> After Sentence 5, the every-5-exchanges trigger fires. The AI pauses and says in Tamil:
>
> *"இதுவரை கவனிச்சேன் — உங்க முக்கிய பிரச்சனை 'Tense Marking' தான். இதை மட்டும் கொஞ்சம் பிராக்டீஸ் பண்ணலாமா?"*
>
> **Practice Mode activates** with 3 targeted sentences.

**🎤 Say to judges:**
> *"This is the moment. Five sentences in — and we've diagnosed the ONE root cause. Most apps give five separate corrections. We give one targeted lesson. Watch the spike shrink as we drill it."*

---

## Judge Q&A Prep

**"Isn't this just Duolingo with extra steps?"**
> "Duolingo corrects symptoms. We diagnose root cause. The Error Fingerprint tells you the *one underlying concept* connecting your last 10 mistakes, so you fix the cause once instead of memorizing 10 unrelated corrections."

**"How is error tagging done?"**
> "Two phases: a rule-based heuristic layer (regex + token comparison) for speed and transparency — you can read the rules. If confidence is low, an LLM classifier kicks in as fallback."

**"Does it work for other languages?"**
> "Yes — swap the 6 root-cause categories for Telugu/Kannada/Hindi interference patterns. The categories are language-specific; the scoring algorithm is generic."

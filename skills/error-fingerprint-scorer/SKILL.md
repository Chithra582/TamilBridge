---
name: error-fingerprint-scorer
description: Compute 6-dimensional radar chart scores and identify the dominant root cause.
---

# Error Fingerprint Scorer Skill

## Overview
Maintains a quantitative profile of a learner's persistent grammar challenges using weighted-coverage algorithms.

## Operations
1. Ingests newly tagged error counts from active utterances.
2. Applies exponential moving average decay over historical sessions.
3. Normalizes scores to a 0-100 scale across all 6 categories and selects the top priority category.

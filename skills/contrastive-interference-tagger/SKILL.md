---
name: contrastive-interference-tagger
description: Classify grammar errors into 6 root-cause Tamil-English interference categories.
---

# Contrastive Interference Tagger Skill

## Overview
Analyzes learner utterances against structural differences between Tamil (L1) and English (L2) to identify root-cause transfer errors.

## Operations
1. Scans tokens for Article Absence, Tense Marking Gap, Preposition Transfer, SOV Calque, Pluralization Skip, and Pronoun Simplification.
2. Labels error coordinates and extracts the erroneous phrase.
3. Outputs tagged error objects for fingerprint aggregation.

# 500-Repo Tuning Delta

Date: 2026-03-26

## Corpus
- Target repos: 500
- Prepared/scanned repos: 499 (1 skipped due missing `git-lfs` in environment)

## Before vs After (Same 500 corpus)

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| Findings total | 4,234 | 641 | -3,593 |
| High severity | 40 | 40 | 0 |
| Medium severity | 4,194 | 601 | -3,593 |
| Generic-high-entropy | 4,194 | 601 | -3,593 |
| Unique rules hit | 8 | 8 | 0 |

## Interpretation
- We significantly reduced generic noise on real-world repositories.
- We preserved high-risk detections (no drop in high count).
- Remaining generic queue is now small enough for targeted manual review + next-pass tuning.

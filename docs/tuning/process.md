# Multi-Repo Tuning Process

This process helps FixYourSecret improve detector quality using multiple repositories over time.

## Weekly cycle

1. Run benchmark gate
- `npm run benchmark`

2. Run multi-repo tune
- `npm run tune:multi`

3. Review false-positive queue
- `docs/tuning/false-positive-review.md`
- mark each row as `confirmed-secret` or `false-positive`

4. Improve detectors
- reduce false positives
- improve missed provider detections

5. Re-run quality
- `npm run quality`

## Local multi-repo setup

Use `fixtures/tuning/repos.default.json` for repo-local testing.

For real tuning across your own repos:
1. Copy `fixtures/tuning/repos.template.json`
2. Save as `fixtures/tuning/repos.local.json`
3. Run:

```bash
node scripts/multi-repo-tune.js \
  --repos-file fixtures/tuning/repos.local.json \
  --output docs/tuning/multi-repo-report.local.json \
  --fp-review docs/tuning/false-positive-review.local.md
```

## Quality targets

- Benchmark recall >= 0.95
- Benchmark precision >= 0.95
- Multi-repo high-risk trend should decrease release over release

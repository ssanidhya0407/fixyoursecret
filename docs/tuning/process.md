# Multi-Repo Tuning Process

This process helps FixYourSecret tune detectors against large, real-world repositories and keep quality improving each week.

## Fast commands

- Small local run:
`npm run tune:multi`

- Large-scale run (uses `fixtures/tuning/repos.large.json`):
`npm run tune:large`

- Quick large-scale smoke run:
`npm run tune:large:quick`

- Weekly 500 regression gate run:
`npm run tune:500:quick && npm run regression:check`

## Large-scale cycle

1. Run benchmark gate first.
- `npm run benchmark`

2. Run large-scale corpus tune.
- `npm run tune:large`

3. Review false-positive queue.
- `docs/tuning/false-positive-review-large.md`
- mark each row as `confirmed-secret` or `false-positive`

4. Tune detector patterns and suppressions.
- lower repeated false positives
- improve missed provider detections

5. Re-run quality.
- `npm run quality`

6. Track trends release-over-release.
- check `docs/tuning/large-report.json`

## Corpus setup

Default large corpus lives in:
- `fixtures/tuning/repos.large.json`

You can also tune against private/company repos:
1. Copy `fixtures/tuning/repos.template.json`
2. Save as `fixtures/tuning/repos.local.json`
3. Add either local `path` entries or remote `url` entries
4. Run:

```bash
node scripts/multi-repo-tune.js \
  --repos-file fixtures/tuning/repos.local.json \
  --workspace .cache/tuning-repos \
  --output docs/tuning/multi-repo-report.local.json \
  --fp-review docs/tuning/false-positive-review.local.md \
  --verify safe
```

## Performance knobs

- `--concurrency <n>`: parallel clone/scan workers (default uses CPU cores)
- `--max-repos <n>`: cap run size for quick passes
- `--clone-depth <n>`: shallow clone depth (default `1`)
- `--verify none|safe`: verification behavior during scan

## Quality targets

- Benchmark recall >= 0.95
- Benchmark precision >= 0.95
- Large-corpus false-positive trend decreases over time
- Large-corpus provider coverage trend increases over time

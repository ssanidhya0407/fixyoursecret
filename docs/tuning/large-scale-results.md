# Large-Scale Tuning Results

Date: 2026-03-26

## Run Profile

- Repositories scanned: 50
- Clone mode: shallow (`--clone-depth 1`)
- Verify mode: `safe`
- Concurrency: 10 workers
- Workspace: system temp cache (outside project root)

## Quality Delta During This Session

| Stage | Findings Total | High | Medium | Notes |
|---|---:|---:|---:|---|
| Before tuning pass | 9,481 | 72 | 9,409 | Generic detector + local cache duplication |
| After workspace isolation + detector hardening | 2,333 | 8 | 2,325 | ~75.4% reduction in total findings |

## Top Active Rules (Current)

1. `generic-high-entropy`: 2,325
2. `private-key-block`: 4
3. `google-key`: 4

## What Changed

- Added high-scale corpus file: `fixtures/tuning/repos.large.json`
- Upgraded multi-repo tuner for:
  - local path + remote URL repo entries
  - parallel clone + scan worker pools
  - CPU-aware default concurrency
  - machine/runtime metadata in output report
- Moved default tuning workspace out of repo to avoid recursive self-scan noise.
- Tightened generic detector to reduce identifier/URL/path false positives.
- Tightened OpenAI detector to avoid CSS/token-name collisions.

## Next Iteration Targets

- Bring `generic-high-entropy` below 1,000 findings on this same 50-repo corpus.
- Add path-aware generic suppressions for benchmark/docs/generated fixtures.
- Add labeled triage sampling script to convert queue rows into precision metrics by rule.

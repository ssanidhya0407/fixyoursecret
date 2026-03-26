# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0] - 2026-03-26

### Added
- Verification v2 provider-safe checks for:
  - OpenAI
  - GitHub
  - Slack
  - Stripe
- 500-repo regression quality gate script:
  - `scripts/check-tuning-regression.js`
  - `fixtures/tuning/regression-thresholds.json`
- Weekly CI now runs:
  - `tune:500:quick`
  - regression gate fail-on-quality-drop

### Improved
- Stronger suppression for obvious fake/placeholder secrets in tests/docs.
- Reduced large-corpus noise while preserving high-risk detections.
- Stable release channel metadata for npm publish.

## [0.3.1-developer-preview.1] - 2026-03-26

### Added
- Expanded detector coverage:
  - Twilio, SendGrid, Mailgun
  - Anthropic, Cohere, Hugging Face
  - GitLab, Telegram, npm token detectors
- Detector registry and shared detector runner
- Benchmark corpus (`fixtures/benchmark/*`) for positive and negative samples
- Benchmark quality gate script (`scripts/benchmark.js`)
- CI benchmark threshold enforcement (recall/precision gate)
- Benchmark unit test
- Multi-repo tuning harness (`scripts/multi-repo-tune.js`)
- Weekly tuning GitHub workflow (`.github/workflows/weekly-tuning.yml`)
- False-positive review artifact generation (`docs/tuning/false-positive-review.md`)

### Improved
- Stronger, measurable provider-detection quality process
- Release quality now validated by tests + benchmark gate

## [0.3.0-developer-preview.1] - 2026-03-26

### Added
- New detectors:
  - AWS access key IDs
  - Stripe secret keys
  - Slack tokens
  - GitHub tokens
  - Private key block detection
- Optional verification mode (`--verify safe`) with `--verify-strict`
- First-class `history` command for commit-history scanning
- Improved false-positive controls:
  - default suppressions for test/fixture contexts
  - value hint ignores (`example`, `dummy`, `fake`, etc.)

### Changed
- Rebranded CLI to `fixyoursecret` (kept `secretlint` alias for compatibility)
- Default config/baseline filenames now:
  - `.fixyoursecretrc.json`
  - `.fixyoursecret-baseline.json`
- CI workflow renamed and SARIF output changed to `fixyoursecret.sarif`

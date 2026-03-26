# Changelog

All notable changes to this project will be documented in this file.

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

# Changelog

All notable changes to this project will be documented in this file.

## [0.4.3] - 2026-03-26

### Improved
- Further reduced residual generic noise on 500 quick corpus runs.
  - Better path-segment detection for `test/spec/examples/docs` style locations.
  - Added targeted generic suppressions for tutorial/audio/base64 and known non-secret artifacts.
  - Strengthened placeholder suppression in non-production contexts.
- 500 quick tuning snapshot improved from 51 findings to 38 findings.

### CI/Release
- Release workflow now publishes a quality summary in job summary and uploads release-quality artifacts.
- Added release artifact bundle:
  - `docs/tuning/report-500.json`
  - `docs/tuning/false-positive-review-500.md`
  - `docs/tuning/release-quality-summary.json`

## [0.4.2] - 2026-03-26

### Fixed
- Release automation now forces Trusted Publisher OIDC mode in GitHub Actions by unsetting token auth in publish step.
- Prevents npm auth-token fallback issues (`E404`) when publishing from tag workflow.

## [0.4.1] - 2026-03-26

### Improved
- Tightened residual generic-noise filtering for large real-world corpora:
  - better `.test/.spec` context detection
  - stronger URL/base64/tutorial-data suppression for generic detector paths
  - additional non-production placeholder filtering for provider fixtures
- Reduced quick 500-corpus findings from 117 to 51 while preserving quality gates.

### CI/Release
- Switched release workflow to Trusted Publisher OIDC mode for npm publish.
- Kept tag-based automated publish via `.github/workflows/release-publish.yml`.

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

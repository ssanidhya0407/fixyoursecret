# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Labeled-corpus benchmark** (`scripts/benchmark-corpus.js`, `npm run
  benchmark:corpus`). Unlike the multi-repo tuner, which only counts findings
  for manual review, this measures *true* precision/recall/F1 against ground
  truth: known secrets planted at known locations across 10+ file types, scored
  alongside realistic hard negatives that must stay clean. Current corpus scores
  1.000 / 1.000 / 1.000. `benchmark:corpus:real` extends the precision check by
  cloning popular public repos and folding their findings into the FP count, and
  the corpus gate is now part of `npm run quality`.
- **Custom rules.** Teams can flag their own internal token formats by adding a
  `customRules` array (id + regex, with optional severity/issue/confidence) to
  `.fixyoursecretrc.json` — no fork required. Capture group 1, when present, is
  treated as the secret value. Invalid or duplicate rules are skipped instead of
  failing the scan, declared severity escalates to HIGH on frontend exposure,
  and custom findings survive `--verify-strict`.

## [0.5.0] - 2026-06-13

### Added
- **Full git-history scanning.** `fixyoursecret history all` (or
  `scan --all-history`) walks every commit on every branch and finds secrets
  that were committed and later deleted — the most common real-world leak
  vector, invisible to a working-tree scan. Each finding is attributed to the
  commit (hash, author, date) so you know exactly what to rotate. Blob
  contents are streamed via a single `git cat-file --batch` process and each
  unique blob is scanned once.
- Greatly expanded default file-type coverage beyond the JS/TS ecosystem.
  Scans now include Python, Go, Ruby, PHP, Java/Kotlin/Scala, Rust, C/C++/C#,
  shell scripts, and config/IaC formats (`.yml`, `.yaml`, `.json`, `.toml`,
  `.ini`, `.tf`, `.tfvars`, and more).
- Generic detection now finds pure-alphanumeric high-entropy secrets (base62
  API keys with no symbols), which were previously excused as code
  identifiers. Discrimination is by character distribution (vowel ratio +
  normalized entropy) rather than length, so camelCase/snake identifiers and
  hex hashes stay clean — verified across ~1,865 files in 9 public repos with
  zero new false positives.

### Changed
- Replaced the brittle list of ~30 corpus-specific generic-noise strings with
  five general structural heuristics (asset/URL context, hyphenated slug,
  multipart boundary, schema/spec vocabulary). Suppression now generalizes to
  repositories the tool was never tuned against instead of memorizing fixtures.
  Benchmark precision/recall stay at 1.0. As a side effect, real `GOCSPX-`
  Google OAuth secrets are no longer blanket-suppressed.

### Fixed
- `--version` and the SARIF report version now read from `package.json`
  instead of stale hardcoded strings, so they can no longer drift from the
  published release.
- The scanner no longer flags its own baseline/SARIF artifacts, which echo
  back secret snippets. Lock files and minified bundles are also ignored by
  default to keep the new coverage from adding generic-token noise.

### Internal
- `fileScanner` now derives its default extensions and ignore globs from
  `DEFAULT_CONFIG`, removing a duplicated source of truth.

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

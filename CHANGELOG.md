# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1-developer-preview.1] - 2026-03-26

### Added
- `.gitignore` defaults for secrets and scan artifacts
- Quickstart terminal transcript (`docs/quickstart-transcript.md`)
- Clear scope statement in README: what Secretlint is and is not

### Changed
- Package marked as Developer Preview
- Removed placeholder repository metadata from `package.json`

## [0.2.0] - 2026-03-26

### Added
- Configurable secret scanning with `.secretlintrc.json`
- Baseline support with `.secretlint-baseline.json`
- Git-aware scan modes: `--staged`, `--tracked`, `--history`
- SARIF output and CI command (`secretlint ci`)
- Pre-commit hook installer (`secretlint hook install`)
- Safe key rotation features (`--dry-run`, backup, hidden input)
- Automated test suite using Node test runner

### Improved
- Better false-positive control for generic entropy detector
- Cleaner CLI output and severity handling

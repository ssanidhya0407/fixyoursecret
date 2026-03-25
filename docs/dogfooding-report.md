# Dogfooding Report (Self-run)

Date: 2026-03-26

I ran Secretlint against three separate sample repositories to simulate real developer usage and tuned the product based on what failed in practice.

## Repo 1: Frontend leak case

Path: `dogfood/repo-frontend-leak`

Scenario:

- React/TSX file with direct OpenAI API call and hardcoded bearer key.

Observed:

- `scan` correctly flagged the leak as HIGH risk.
- `fix` initially missed it because the detector did not handle quoted `"Authorization"` keys.

Action taken:

- Updated `commands/fix.js` regex to support quoted and unquoted authorization keys.

Result after fix:

- `fix` correctly identifies risky file and generates templates.

## Repo 2: Backend clean service

Path: `dogfood/repo-backend-clean`

Scenario:

- Backend service with long but non-secret identifiers.

Observed:

- No findings (good).

Action taken:

- No detector change required.

## Repo 3: Monorepo + staged scanning

Path: `dogfood/repo-monorepo`

Scenario:

- API package containing a Google key pattern in `.env`-style file.
- Verified `--staged` and full scan behavior.

Observed:

- Leak detected as expected.
- Risk reason text initially claimed frontend context due `/src/` heuristic.

Action taken:

- Improved path heuristic in `utils/riskAnalyzer.js`:
  - added backend path hints (`/api/`, `/server/`, `/backend/`, `/services/`)
  - avoid treating `.env` files as frontend by default

Result after fix:

- Correct reason: known provider key format (backend context), still HIGH severity.

## Additional hardening found during dogfooding

1. `utils/fileScanner.js` fallback regression:
- `fix` command was reading zero files when extension list was not passed.
- Added default extension fallback in `collectProjectFiles`.

2. CI hygiene:
- Temporary dogfood leaks can poison CI signal.
- Kept dogfood repos sanitized after testing.

## Outcome

Dogfooding produced three concrete fixes that are now implemented:

- Better `fix` detection for real-world frontend auth header style
- More accurate frontend/backend risk reasoning
- Safer file scanner defaults for all commands

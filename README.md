# Secretlint

Secretlint is a CLI-first secret scanner for developers. It detects leaked API keys, flags frontend exposure risk, generates backend proxy fixes, and helps rotate keys safely.

Status: Developer Preview.

## What This Tool Is / Is Not

What it is:

- A fast guardrail that catches common secret leaks early in local dev, pre-commit, and CI.
- A practical fixer that generates backend proxy starter code and a frontend patch helper.
- A guided helper for key rotation and safer `.env` updates.

What it is not:

- Not a complete security audit of your application.
- Not a replacement for cloud secret managers, IAM policies, or runtime security controls.
- Not a guarantee that every possible credential format will be detected.

## Production-Ready MVP Features

- ESLint-style terminal output with colored severity
- Regex detectors for OpenAI, Google, and generic high-entropy tokens
- Frontend exposure risk analysis for `src/components/pages/public/app`
- Git-aware scan scopes:
  - `--staged` (pre-commit)
  - `--tracked` (tracked repo files)
  - `--history <n>` (files changed in last n commits)
- Config + suppressions via `.secretlintrc.json`
- Baseline support (`.secretlint-baseline.json`) for gradual adoption
- JSON and SARIF output for CI security tooling
- `fix` templates for backend proxy + frontend migration helper
- `rotate` with hidden input, dry-run, `.env` backup, and safe update
- Pre-commit hook installer

## Install Locally

```bash
npm install
npm test
npm link
```

## Quick Start

```bash
secretlint init
secretlint scan
secretlint scan --staged
secretlint ci --output-file secretlint.sarif
secretlint fix
secretlint rotate openai
secretlint hook install
```

Quick demo transcript:

- `docs/quickstart-transcript.md`

## GitHub CI (Ready to use)

This repo includes:

- `.github/workflows/secretlint-ci.yml`

Workflow behavior:

1. Installs dependencies
2. Runs tests
3. Runs Secretlint CI scan and emits `secretlint.sarif`
4. Uploads SARIF to GitHub Code Scanning
5. Uploads SARIF as build artifact

## Publish to npm

```bash
npm ci
npm test
npm pack --dry-run
npm publish --access public
```

Release checklist is documented in:

- `RELEASING.md`
- `CHANGELOG.md`

## Scan Command

```bash
secretlint scan [options]
```

Options:

- `--format text|json|sarif`
- `--output-file <path>`
- `--fail-on low|medium|high`
- `--config <path>`
- `--staged`
- `--tracked`
- `--history <n>`
- `--baseline <path>`
- `--update-baseline`
- `--no-baseline`

## Fix Command

```bash
secretlint fix --output secretlint-output
```

Generates:

- `secretlint-output/backend.js` (Express `/api/ai` proxy using `process.env.OPENAI_API_KEY`)
- `secretlint-output/frontend.patch.js` (helper for replacing direct frontend API calls)

## Rotate Command

```bash
secretlint rotate openai [--dry-run] [--env-file .env] [--key <value>]
```

- Hidden terminal input when interactive
- Dry-run mode for safe preview
- Automatic `.env.bak.<timestamp>` backup before write
- Replaces existing key or appends missing key

## Config File (`.secretlintrc.json`)

```json
{
  "ignorePaths": ["node_modules/**", ".git/**", "dist/**", "build/**"],
  "allowedExtensions": [".js", ".ts", ".jsx", ".tsx", ".env", ".swift"],
  "maxFileSizeKB": 256,
  "entropyThreshold": 3.8,
  "failOn": "high",
  "ignoreDetectors": [],
  "suppressions": [
    { "rule": "generic-high-entropy", "path": "src/safe-fixture.js", "line": 12 }
  ]
}
```

Inline suppression:

```js
// secretlint-disable-next-line
const token = "known_fake_test_token_1234567890";
```

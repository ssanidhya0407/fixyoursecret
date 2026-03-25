<div align="center">

# Secretlint

**Developer Preview**

ESLint-style secret scanning for modern codebases.
Detect leaks early, flag frontend exposure, generate backend-safe fixes, and guide key rotation.

[![Node >= 20](https://img.shields.io/badge/node-%3E%3D20-2ea44f)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://img.shields.io/badge/ci-github%20actions-2088ff)](https://github.com/ssanidhya0407/secretlint/actions)

</div>

---

## Why Secretlint
Secret leaks are one of the most common and expensive developer mistakes.

Secretlint helps teams:

- Catch exposed keys before merge
- Identify high-risk frontend leaks quickly
- Generate practical migration templates
- Rotate leaked keys safely and consistently

---

## What It Is / Is Not
### What it is
- A fast CLI guardrail for local dev, pre-commit, and CI
- An actionable scanner with file/line/snippet/fix guidance
- A practical helper for incident response and key rotation

### What it is not
- Not a full security audit platform
- Not a replacement for secret managers, IAM, or runtime controls
- Not a guarantee for every credential format in existence

---

## Core Features
- ESLint-style colored terminal output
- Built-in detectors:
  - OpenAI API keys
  - Google API keys
  - Generic high-entropy tokens
- Frontend exposure analysis (`src`, `components`, `pages`, `public`, `app`)
- Git-aware scan modes (`--staged`, `--tracked`, `--history <n>`)
- Config + suppressions (`.secretlintrc.json`)
- Baseline support (`.secretlint-baseline.json`) for gradual adoption
- CI-friendly output: `json` and `sarif`
- Fix generation templates (`secretlint fix`)
- Safe key rotation flow (`secretlint rotate`)
- One-command pre-commit hook install

---

## Installation
```bash
npm install
npm test
npm link
```

---

## 30-Second Quick Start
```bash
secretlint init
secretlint scan
secretlint fix
secretlint rotate openai --dry-run
secretlint hook install
```

Detailed transcript:
- [docs/quickstart-transcript.md](./docs/quickstart-transcript.md)

Dogfooding notes:
- [docs/dogfooding-report.md](./docs/dogfooding-report.md)

---

## Command Reference
| Command | Purpose | Example |
|---|---|---|
| `secretlint init` | Create default config + baseline files | `secretlint init --force` |
| `secretlint scan` | Scan files for leaks and risk | `secretlint scan --staged --fail-on high` |
| `secretlint ci` | CI-focused SARIF scan | `secretlint ci --output-file secretlint.sarif` |
| `secretlint fix` | Generate backend proxy + frontend patch helper | `secretlint fix --output secretlint-output` |
| `secretlint rotate <provider>` | Rotate key and update env safely | `secretlint rotate openai --dry-run` |
| `secretlint hook install` | Install pre-commit protection | `secretlint hook install` |

---

## Scan Options
```bash
secretlint scan [options]
```

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

---

## Generated Fix Artifacts
Running:

```bash
secretlint fix --output secretlint-output
```

Creates:

- `secretlint-output/backend.js`
- `secretlint-output/frontend.patch.js`

`backend.js` exposes `/api/ai` and uses `process.env.OPENAI_API_KEY`.

---

## Safe Rotation Flow
```bash
secretlint rotate openai [--dry-run] [--env-file .env] [--key <value>]
```

Behavior:

- Hidden key input in interactive terminals
- Dry-run preview mode
- Automatic backup (`.env.bak.<timestamp>`) before write
- Replace-or-append env key update strategy

---

## Configuration (`.secretlintrc.json`)
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

---

## CI Integration (GitHub Actions)
This repo includes:

- [.github/workflows/secretlint-ci.yml](./.github/workflows/secretlint-ci.yml)

Workflow steps:

1. Install dependencies
2. Run tests
3. Run Secretlint CI scan and emit `secretlint.sarif`
4. Upload SARIF to GitHub Code Scanning
5. Upload SARIF artifact

---

## Publish
```bash
npm ci
npm test
npm pack --dry-run
npm publish --access public
```

Release docs:
- [RELEASING.md](./RELEASING.md)
- [CHANGELOG.md](./CHANGELOG.md)

---

## License
MIT. See [LICENSE](./LICENSE).

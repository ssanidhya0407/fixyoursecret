<div align="center">

# FixYourSecret

**Developer Preview**

An ESLint-style CLI that finds leaked credentials, flags frontend exposure, suggests fixes, and helps rotate keys safely.

[![Node >= 20](https://img.shields.io/badge/node-%3E%3D20-2ea44f)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://img.shields.io/badge/ci-github%20actions-2088ff)](https://github.com/ssanidhya0407/fixyoursecret/actions)

</div>

---

## What Problem This Solves
Developers accidentally commit API keys, tokens, or private keys. That leads to abuse, unexpected costs, and incident response fire drills.

FixYourSecret helps teams catch these mistakes early and fix them with clear next steps.

---

## Why This Is Stronger Now
- Expanded provider detector coverage significantly.
- Added benchmark-driven quality gates (`npm run benchmark`) so quality is measured every release.
- Added CI threshold enforcement for recall/precision.
- Added optional local verification mode for higher-confidence findings.

---

## Detector Coverage
FixYourSecret currently includes detector coverage for:

- OpenAI
- Google
- AWS Access Key IDs
- Stripe Secret Keys
- Slack Tokens
- GitHub Tokens
- GitLab Tokens
- Twilio API Keys
- SendGrid API Keys
- Mailgun API Keys
- Anthropic API Keys
- Cohere API Keys
- Hugging Face Tokens
- Telegram Bot Tokens
- npm Tokens
- Private Key Blocks
- Generic High-Entropy Tokens

---

## What You Get
- Fast secret scanning with file/line/snippet output
- Frontend exposure risk highlighting
- Optional safe verification mode (`--verify safe`)
- First-class history scanning (`history`)
- Better false-positive controls (hints + suppressions + defaults)
- Baseline support for gradual rollout
- SARIF output for CI/security platforms
- Template-based fix generation (`fix`)
- Guided key rotation (`rotate`)

---

## Install
```bash
npm install
npm test
npm link
```

You can run either command name (compatibility included):

```bash
fixyoursecret --help
secretlint --help
```

---

## Quick Start
```bash
fixyoursecret init
fixyoursecret scan --verify safe
fixyoursecret history 30
fixyoursecret fix
fixyoursecret rotate openai --dry-run
fixyoursecret hook install
```

---

## Quality and Benchmarks
Run quality checks locally:

```bash
npm run quality
```

Run benchmark only:

```bash
npm run benchmark
```

Run multi-repo tuning report:

```bash
npm run tune:multi
```

Run large-scale corpus tuning (parallel clone + scan):

```bash
npm run tune:large
```

Generate and run 500-repo corpus:

```bash
npm run corpus:generate
npm run tune:500
```

Quick large-scale pass:

```bash
npm run tune:large:quick
```

CI quality gate thresholds (defaults):
- Recall >= 0.95
- Precision >= 0.95

These can be tuned via env vars:
- `BENCH_MIN_RECALL`
- `BENCH_MIN_PRECISION`

Tuning workflow docs:
- [./docs/tuning/process.md](./docs/tuning/process.md)
- Large corpus list: [./fixtures/tuning/repos.large.json](./fixtures/tuning/repos.large.json)

---

## Command Cheat Sheet
| Command | Purpose | Example |
|---|---|---|
| `fixyoursecret init` | Create default config and baseline files | `fixyoursecret init --force` |
| `fixyoursecret scan` | Scan current working tree | `fixyoursecret scan --verify safe` |
| `fixyoursecret history <n>` | Scan files touched in last `n` commits | `fixyoursecret history 50 --verify safe` |
| `fixyoursecret ci` | CI-focused SARIF scan | `fixyoursecret ci --output-file fixyoursecret.sarif` |
| `fixyoursecret fix` | Generate backend proxy + frontend patch helper | `fixyoursecret fix --output fixyoursecret-output` |
| `fixyoursecret rotate <provider>` | Rotate and update env safely | `fixyoursecret rotate openai --dry-run` |
| `fixyoursecret hook install` | Install pre-commit secret scan hook | `fixyoursecret hook install` |

---

## Scan Options
```bash
fixyoursecret scan [options]
```

- `--format text|json|sarif`
- `--output-file <path>`
- `--fail-on low|medium|high`
- `--config <path>`
- `--verify none|safe`
- `--verify-strict`
- `--staged`
- `--tracked`
- `--history <n>`
- `--baseline <path>`
- `--update-baseline`
- `--no-baseline`

---

## Verification Mode (Optional)
`--verify safe` performs local structure checks for supported detectors (no external API calls).

Use `--verify-strict` to drop findings that fail verification.

---

## Config (`.fixyoursecretrc.json`)
```json
{
  "ignorePaths": ["node_modules/**", ".git/**", ".cache/**", "dist/**", "build/**", ".next/**", "coverage/**", "vendor/**", "tmp/**"],
  "allowedExtensions": [".js", ".ts", ".jsx", ".tsx", ".env", ".swift"],
  "maxFileSizeKB": 256,
  "entropyThreshold": 3.8,
  "failOn": "high",
  "verifyMode": "none",
  "ignoreDetectors": [],
  "ignoreValueHints": ["example", "dummy", "fake", "sample", "replace_in_runtime_only"],
  "suppressions": [
    { "path": "test/" },
    { "path": "tests/" },
    { "path": "__tests__/" },
    { "path": "fixtures/" }
  ]
}
```

Inline suppression comments supported:

```js
// fixyoursecret-disable-next-line
const token = "fake_token_for_docs_only";
```

---

## CI Integration
Workflow file included:

- [./.github/workflows/fixyoursecret-ci.yml](./.github/workflows/fixyoursecret-ci.yml)

It runs tests, benchmark gate, scan, and uploads SARIF.

---

## Publish
```bash
npm ci
npm run quality
npm pack --dry-run
npm publish --access public
```

---

## Notes
- Existing users of `secretlint` command are still supported via alias.
- Brand chosen to avoid naming collision with existing Secretlint ecosystem tooling.

---

## License
MIT. See [LICENSE](./LICENSE).

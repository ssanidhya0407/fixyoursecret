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

## What You Get
- Fast secret scanning with file/line/snippet output
- Frontend exposure risk highlighting
- Built-in detectors:
  - OpenAI keys
  - Google keys
  - AWS access key IDs
  - Stripe secret keys
  - Slack tokens
  - GitHub tokens
  - Private key blocks
  - Generic high-entropy tokens
- Optional safe verification mode (`--verify safe`)
- First-class history scanning command (`history`)
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
fixyoursecret scan
fixyoursecret history 30
fixyoursecret fix
fixyoursecret rotate openai --dry-run
fixyoursecret hook install
```

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
  "ignorePaths": ["node_modules/**", ".git/**", "dist/**", "build/**", ".next/**", "coverage/**"],
  "allowedExtensions": [".js", ".ts", ".jsx", ".tsx", ".env", ".swift"],
  "maxFileSizeKB": 256,
  "entropyThreshold": 3.8,
  "failOn": "high",
  "verifyMode": "none",
  "ignoreDetectors": [],
  "ignoreValueHints": ["example", "dummy", "fake", "sample", "replace_in_runtime_only"],
  "suppressions": [
    { "rule": "generic-high-entropy", "path": "test/" },
    { "rule": "generic-high-entropy", "path": "fixtures/" }
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

It runs tests, performs scan, and uploads SARIF.

---

## Publish
```bash
npm ci
npm test
npm pack --dry-run
npm publish --access public
```

---

## Notes
- Existing users of `secretlint` command are still supported via alias.
- Brand name chosen to avoid collision with existing Secretlint ecosystem naming.

---

## License
MIT. See [LICENSE](./LICENSE).

<div align="center">
  <img src="./assets/logo.png" alt="FixYourSecret logo" width="260" />

# FixYourSecret

**The ESLint-style CLI that catches leaked secrets before they become incidents.**

[![npm version](https://img.shields.io/npm/v/fixyoursecret?color=0B57D0)](https://www.npmjs.com/package/fixyoursecret)
[![Node >= 20](https://img.shields.io/badge/node-%3E%3D20-2ea44f)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/ssanidhya0407/fixyoursecret/fixyoursecret-ci.yml?label=ci)](https://github.com/ssanidhya0407/fixyoursecret/actions)
</div>

## Why FixYourSecret Exists
Secrets leak in real projects all the time: copied examples, test files, frontend code, old commits, and rushed hotfixes.

FixYourSecret gives you a fast, practical workflow:
1. **Find** exposed keys and tokens.
2. **Prioritize** by risk (especially frontend exposure).
3. **Fix** with generated backend proxy templates.
4. **Rotate** keys safely.
5. **Gate CI** so regressions do not slip back in.

## What It Detects
Built-in detectors currently include:
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

## Core Commands
| Command | What it does |
|---|---|
| `fixyoursecret scan` | Scans current codebase and reports risky findings |
| `fixyoursecret history 20` | Scans files touched in last N commits |
| `fixyoursecret ci` | CI-focused SARIF scan with safer defaults |
| `fixyoursecret fix` | Generates backend proxy + frontend patch helper |
| `fixyoursecret rotate openai` | Guides secure key rotation and updates `.env` |
| `fixyoursecret hook install` | Installs a pre-commit protection hook |

## Install
```bash
npm install -g fixyoursecret
fixyoursecret --help
```

For local development of this repo:
```bash
npm install
npm test
npm link
```

Compatibility alias also works:
```bash
secretlint --help
```

## 60-Second Quick Start
```bash
fixyoursecret init
fixyoursecret scan --verify safe
fixyoursecret history 30 --verify safe
fixyoursecret fix --output fixyoursecret-output
fixyoursecret rotate openai --dry-run
fixyoursecret hook install
```

## Example Output
```text
[HIGH] OpenAI key exposed in frontend
File: demo/src/App.js:12
Detector: openai-api-key
Risk: HIGH
Fix: Move secret to backend and call internal proxy endpoint
```

## Verification Mode
Use verification when you want fewer false positives:
```bash
fixyoursecret scan --verify safe
fixyoursecret scan --verify safe --verify-strict
```

`safe` mode uses provider-safe structural checks only (no external API calls).

## Baseline Support
Baselines let teams adopt secret scanning without breaking every existing build on day one.

```bash
fixyoursecret scan --update-baseline
fixyoursecret scan
```

## CI and Security Platform Output
Generate SARIF for GitHub code scanning or other platforms:

```bash
fixyoursecret ci --output-file fixyoursecret.sarif
```

## Quality Gates and Tuning
This repo ships with benchmark and multi-repo tuning scripts:

```bash
npm run quality
npm run benchmark
npm run tune:500:quick
npm run regression:check
```

Useful docs:
- [Tuning Process](./docs/tuning/process.md)
- [Large Scale Results](./docs/tuning/large-scale-results.md)
- [500 Repo Delta](./docs/tuning/results-500-delta.md)
- [Dogfooding Report](./docs/dogfooding-report.md)

## Config
Default config file: `.fixyoursecretrc.json`

Important knobs:
- `ignorePaths`
- `allowedExtensions`
- `entropyThreshold`
- `ignoreDetectors`
- `ignoreValueHints`
- `suppressions`

Inline suppression is supported:

```js
// fixyoursecret-disable-next-line
const token = "fake_token_for_docs_only";
```

## Release Flow
Release notes and process live in:
- [RELEASING.md](./RELEASING.md)
- [CHANGELOG.md](./CHANGELOG.md)

## License
MIT © FixYourSecret contributors

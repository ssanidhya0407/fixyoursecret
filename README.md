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
| `fixyoursecret history all` | Scans the **full git history** (all branches), catching secrets in deleted/old commits with commit attribution |
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

## Custom Rules
Flag your own internal token formats without forking. Add a `customRules` array to `.fixyoursecretrc.json`:

```json
{
  "customRules": [
    {
      "id": "acme-internal-token",
      "regex": "acme_[a-f0-9]{32}",
      "severity": "high",
      "issue": "Acme internal token exposed"
    }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Unique rule name; shown as the finding's rule. |
| `regex` | yes | JavaScript regex. If it has a capture group, group 1 is treated as the secret value. |
| `severity` | no | `low` \| `medium` \| `high` (default `high`). Escalates to `high` automatically on frontend exposure. |
| `issue` | no | Human-readable description. |
| `confidence` | no | `low` \| `medium` \| `high` (default `medium`). |
| `flags` | no | Regex flags (`g` is always applied). |

Rules with an invalid or duplicate regex are skipped rather than failing the scan. Custom findings are treated as verified, so they survive `--verify-strict`.

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

### GitHub Action
Add secret scanning to any repo in one step. Findings appear in the **Security → Code scanning** tab and the build fails on high-severity leaks:

```yaml
# .github/workflows/secrets.yml
name: Secret Scan
on: [push, pull_request]
permissions:
  contents: read
  security-events: write
jobs:
  fixyoursecret:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ssanidhya0407/fixyoursecret@v1
        with:
          fail-on: high      # low | medium | high
          verify: safe       # none | safe
```

Inputs: `path`, `fail-on`, `verify`, `sarif-file`, `upload-sarif`, `version`, `args`.

### Pre-commit hook (pre-commit.com)
Block secrets before they are committed. Add to `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/ssanidhya0407/fixyoursecret
    rev: v0.6.0   # or the latest release
    hooks:
      - id: fixyoursecret
```

Then `pre-commit install`. The hook scans staged changes and blocks the commit on high-severity findings. (For a zero-dependency local hook instead, run `fixyoursecret hook install`.)

## Accuracy
FixYourSecret ships a **labeled-corpus benchmark** that measures true precision and recall against ground truth — known secrets planted at known locations, alongside realistic hard negatives (hashes, UUIDs, data URIs, model names, example keys) that must stay clean.

| Metric | Score |
|---|---|
| Precision | **1.000** |
| Recall | **1.000** |
| F1 | **1.000** |

_15 planted secrets across 10+ file types and frontend/backend paths; 10 hard-negative files. Reproduce with `npm run benchmark:corpus`._

For real-world false-positive validation, `npm run benchmark:corpus:real` additionally clones popular public repositories and folds their findings into the precision measurement.

## Quality Gates and Tuning
This repo ships with benchmark and multi-repo tuning scripts:

```bash
npm run quality            # tests + synthetic benchmark + labeled corpus
npm run benchmark          # synthetic positive/negative gate
npm run benchmark:corpus   # labeled corpus: true precision/recall/F1
npm run tune:500:quick     # large-scale false-positive review
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
MIT © [Sanidhya Singh](https://github.com/ssanidhya0407)

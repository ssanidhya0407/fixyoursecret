# GitHub Marketplace Listing

Copy for publishing **action.yml** to the GitHub Marketplace.

## How to publish
1. Go to the repo → **Releases** → the `v0.6.0` release (or draft a new release on the `v1` tag).
2. Check **"Publish this Action to the GitHub Marketplace."**
3. Accept the Marketplace agreement, pick the categories below, and paste the copy.
4. GitHub validates `action.yml` (name, description, branding). The name must be unique across the Marketplace — if "FixYourSecret" is taken, use "FixYourSecret Scanner."

## Primary category
**Security**

## Secondary category
**Continuous integration**

## Listing name
FixYourSecret — Secret Scanner that Fixes, Not Just Finds

## Short description (≤ 125 chars)
Find leaked secrets, rank them by real exploitability, and get the fix — with SARIF code scanning and a CI gate.

## Full description

**Most scanners hand you a list of leaked strings. FixYourSecret closes the loop.**

It finds exposed API keys and tokens, **ranks each by real exploitability** (a key shipping in `src/` is HIGH; the same key in a backend `.env` is not), generates the **backend proxy fix**, and guides **key rotation** — then gates CI so it never comes back.

### Why teams choose it
- 🎯 **Risk-ranked, not just listed.** Frontend-exposed secrets are escalated to HIGH automatically — triage the exploitable ones first.
- 🛠️ **Remediation, not homework.** Generates a backend proxy + frontend patch so the secret leaves the client, plus a guided rotation flow.
- 🕳️ **Full git-history scanning.** Catches secrets that were committed and later deleted — the leaks a working-tree scan can't see — with commit attribution.
- ✅ **Accuracy you can verify.** A labeled-corpus benchmark (ground-truth precision/recall) ships in the repo: `npm run benchmark:corpus`.
- 🧩 **Custom rules.** Flag your own internal token formats via config — no fork.
- 🔌 **One-paste adoption.** This Action + SARIF code scanning, or a pre-commit hook.

### Usage
```yaml
- uses: ssanidhya0407/fixyoursecret@v1
  with:
    fail-on: high     # low | medium | high
    verify: safe      # none | safe
```

Findings appear in **Security → Code scanning**. Inputs: `path`, `fail-on`, `verify`, `sarif-file`, `upload-sarif`, `version`, `args`.

MIT licensed · Node ≥ 20 · zero config to start.

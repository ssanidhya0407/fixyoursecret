# Releasing FixYourSecret

## 0) One-time GitHub setup

1. Add repository secret:
- `NPM_TOKEN` = npm automation token with publish access to `fixyoursecret`

2. Confirm workflow exists:
- `.github/workflows/release-publish.yml`

## 1) Pre-release checks

```bash
npm ci
npm run quality
npm run tune:500:quick
npm run regression:check
npm run ci -- --output-file fixyoursecret.sarif --fail-on high --verify safe
npm pack --dry-run
```

## 2) Version bump

```bash
npm version patch
```

## 3) Push tag to trigger automated publish

```bash
git push origin main --follow-tags
```

This triggers GitHub Actions workflow:
- `Release Publish`

## 4) Optional manual fallback publish

```bash
npm publish --access public --provenance
```

## 5) Post-publish smoke test

```bash
npx fixyoursecret --help
```

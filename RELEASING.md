# Releasing Secretlint

## 1) Pre-release checks

```bash
npm ci
npm test
npm run ci -- --output-file secretlint.sarif --fail-on high
npm pack --dry-run
```

## 2) Set package metadata (required before public publish)

Update `package.json` with your real repository details:

- `repository.url`
- `homepage`
- `bugs.url`

## 3) Version bump

```bash
npm version patch
```

## 4) Publish

```bash
npm publish --access public
```

## 5) Post-publish smoke test

```bash
npx secretlint --help
```

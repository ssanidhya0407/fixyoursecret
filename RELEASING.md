# Releasing FixYourSecret

## 1) Pre-release checks

```bash
npm ci
npm run quality
npm run tune:multi
npm run ci -- --output-file fixyoursecret.sarif --fail-on high --verify safe
npm pack --dry-run
```

## 2) Version bump

```bash
npm version patch
```

## 3) Publish

```bash
npm publish --access public
```

## 4) Post-publish smoke test

```bash
npx fixyoursecret --help
```

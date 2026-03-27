# Releasing FixYourSecret

Publishing is manual only (from a maintainer machine).

## 1) Pre-release checks

```bash
npm ci
npm run quality
npm run tune:500:quick
npm run regression:check
npm run ci -- --output-file fixyoursecret.sarif --fail-on high --verify safe
npm pack --dry-run
```

## 2) Bump version

```bash
npm version patch
```

## 3) Push code and tag

```bash
git push origin main --follow-tags
```

## 4) Publish from local machine

```bash
npm login
npm publish --access public
```

If your npm account enforces OTP, run:

```bash
npm publish --access public --otp <6_digit_code>
```

## 5) Verify publish

```bash
npm view fixyoursecret version
npx fixyoursecret --help
```

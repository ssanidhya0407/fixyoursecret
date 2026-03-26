export function verifyFinding(match, fileContent = "", snippet = "") {
  const value = String(match.value || "");
  const lowerSnippet = String(snippet || "").toLowerCase();

  switch (match.rule) {
    case "openai-key": {
      const formatOk = /^sk-(?:proj-)?[A-Za-z0-9_-]{24,}$/.test(value);
      const hasDiversity = hasDiversityScore(value, 3);
      const verified = formatOk && hasDiversity && !isLikelyPlaceholderToken(value, lowerSnippet);
      return formatResult(verified, "provider-safe-v2");
    }
    case "google-key":
      return formatResult(/^AIza[0-9A-Za-z_-]{35}$/.test(value), "provider-safe-v2");
    case "aws-access-key-id":
      return formatResult(/^(AKIA|ASIA)[A-Z0-9]{16}$/.test(value), "provider-safe-v2");
    case "stripe-secret-key": {
      const formatOk = /^sk_live_[0-9A-Za-z]{20,}$/.test(value);
      const verified = formatOk && !isLikelyPlaceholderToken(value, lowerSnippet);
      return formatResult(verified, "provider-safe-v2");
    }
    case "slack-token": {
      const formatOk = /^xox(?:b|p|a|r|s)-[0-9A-Za-z-]{10,}$/.test(value);
      const hasSegments = value.split("-").length >= 3;
      const verified = formatOk && hasSegments && !isLikelyPlaceholderToken(value, lowerSnippet);
      return formatResult(verified, "provider-safe-v2");
    }
    case "github-token": {
      const formatOk = /^(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}$|^github_pat_[A-Za-z0-9_]{40,}$/.test(value);
      const verified = formatOk && !isLikelyPlaceholderToken(value, lowerSnippet);
      return formatResult(verified, "provider-safe-v2");
    }
    case "gitlab-token":
      return formatResult(/^glpat-[A-Za-z0-9_-]{20,}$/.test(value), "provider-safe-v2");
    case "twilio-api-key":
      return formatResult(/^SK[0-9a-fA-F]{32}$/.test(value), "provider-safe-v2");
    case "sendgrid-api-key":
      return formatResult(/^SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/.test(value), "provider-safe-v2");
    case "mailgun-api-key":
      return formatResult(/^key-[A-Za-z0-9]{32}$/.test(value), "provider-safe-v2");
    case "anthropic-api-key":
      return formatResult(/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(value), "provider-safe-v2");
    case "cohere-api-key":
      return formatResult(/^co_[A-Za-z0-9]{30,}$/.test(value), "provider-safe-v2");
    case "huggingface-token":
      return formatResult(/^hf_[A-Za-z0-9]{30,}$/.test(value), "provider-safe-v2");
    case "telegram-bot-token":
      return formatResult(/^\d{8,10}:[A-Za-z0-9_-]{35}$/.test(value), "provider-safe-v2");
    case "npm-token":
      return formatResult(/^npm_[A-Za-z0-9]{36}$/.test(value), "provider-safe-v2");
    case "private-key-block": {
      const hasEnd = /-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(fileContent.slice(match.index));
      return formatResult(hasEnd, "pem-structure");
    }
    case "generic-high-entropy":
      return formatResult(false, "unsupported");
    default:
      return formatResult(false, "unknown");
  }
}

function formatResult(verified, method) {
  return {
    verified,
    verificationMethod: method,
  };
}

export function normalizeVerifyMode(mode) {
  const safe = String(mode || "none").toLowerCase();
  return ["none", "safe"].includes(safe) ? safe : "none";
}

export function shouldSkipAsNonSecret(match, snippet = "", filePath = "", hints = []) {
  const lowerSnippet = snippet.toLowerCase();
  const lowerPath = filePath.toLowerCase();
  const value = String(match.value || "");
  const isNonProdPath = ["/test/", "/tests/", "/__tests__/", "/fixtures/", "/docs/", "/examples/", "/spec/"]
    .some((segment) => lowerPath.includes(segment));

  const builtinHints = ["example", "dummy", "fake", "sample", "not_secret", "replace_in_runtime_only", "docs_only"];
  const allHints = [...builtinHints, ...hints.map((h) => String(h).toLowerCase())];

  if (allHints.some((hint) => lowerSnippet.includes(hint))) return true;
  if (isNonProdPath && isLikelyPlaceholderToken(value, lowerSnippet)) return true;

  if (
    isNonProdPath &&
    /(?:ghp_|github_pat_|xox[bpars]-|sk_live_|sk-)/.test(value) &&
    /(?:x{6,}|y{6,}|z{6,}|123456|example|dummy|placeholder|mock|test[_-]?key|your[_-]?key)/i.test(lowerSnippet + " " + value.toLowerCase())
  ) {
    return true;
  }

  if (
    match.rule === "generic-high-entropy" &&
    [
      "/test/",
      "/tests/",
      "/__tests__/",
      "/fixtures/",
      "/docs/",
      "/spec/",
      "/bench/",
      "/benchmark/",
      "/examples/",
      "/migrations/",
      "/generated/",
      "/api-client/",
      "/fonts/",
      "/vendor/"
    ].some((segment) => lowerPath.includes(segment))
  ) {
    return true;
  }

  if (match.rule === "generic-high-entropy") {
    const genericNoiseHints = [
      "canvasrenderingcontext2d",
      "axios parameter creator",
      "sourcemappingurl=data:",
      "base64,",
      "images.unsplash.com",
      ".woff2",
      "oauth2",
      "requestparameters",
      "data-cy=",
      "uuid",
      "v1alpha1",
      "openapi",
      "migration",
      "model:",
      "anthropiccontext1m",
      "bigint64arraybytes_per_element",
      "claude-sonnet",
      "gemini-"
    ];
    if (genericNoiseHints.some((hint) => lowerSnippet.includes(hint))) return true;
  }

  return false;
}

function isLikelyPlaceholderToken(value, lowerSnippet = "") {
  const lowerValue = String(value || "").toLowerCase();
  const joined = `${lowerValue} ${lowerSnippet}`;
  if (!lowerValue) return false;

  if (/(?:x{8,}|0{8,}|12345678)/.test(lowerValue)) return true;
  if (/(?:example|dummy|placeholder|mock|redacted|sanitized|masked)/.test(joined)) return true;
  if (/(?:ghp_x+|xox[bpars]-x+|sk_live_x+|sk-[a-z]*x{8,})/.test(lowerValue)) return true;
  if (/(?:your[_-]?token|your[_-]?key|replace[_-]?me|insert[_-]?key)/.test(joined)) return true;
  return false;
}

function hasDiversityScore(value, minClasses) {
  const classes = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[_-]/.test(value),
  ].filter(Boolean).length;
  return classes >= minClasses;
}

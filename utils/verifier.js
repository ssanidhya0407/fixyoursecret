export function verifyFinding(match, fileContent = "", snippet = "") {
  switch (match.rule) {
    case "openai-key":
      return formatResult(/^(?:sk-(?:proj-)?)?[A-Za-z0-9_-]{24,}$/.test(match.value) && /\d/.test(match.value), "format");
    case "google-key":
      return formatResult(/^AIza[0-9A-Za-z_-]{35}$/.test(match.value), "format");
    case "aws-access-key-id":
      return formatResult(/^(AKIA|ASIA)[A-Z0-9]{16}$/.test(match.value), "format");
    case "stripe-secret-key":
      return formatResult(/^sk_live_[0-9A-Za-z]{16,}$/.test(match.value), "format");
    case "slack-token":
      return formatResult(/^xox(?:b|p|a|r|s)-[0-9A-Za-z-]{10,}$/.test(match.value), "format");
    case "github-token":
      return formatResult(/^(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}$|^github_pat_[A-Za-z0-9_]{20,}$/.test(match.value), "format");
    case "gitlab-token":
      return formatResult(/^glpat-[A-Za-z0-9_-]{20,}$/.test(match.value), "format");
    case "twilio-api-key":
      return formatResult(/^SK[0-9a-fA-F]{32}$/.test(match.value), "format");
    case "sendgrid-api-key":
      return formatResult(/^SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/.test(match.value), "format");
    case "mailgun-api-key":
      return formatResult(/^key-[A-Za-z0-9]{32}$/.test(match.value), "format");
    case "anthropic-api-key":
      return formatResult(/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(match.value), "format");
    case "cohere-api-key":
      return formatResult(/^co_[A-Za-z0-9]{30,}$/.test(match.value), "format");
    case "huggingface-token":
      return formatResult(/^hf_[A-Za-z0-9]{30,}$/.test(match.value), "format");
    case "telegram-bot-token":
      return formatResult(/^\d{8,10}:[A-Za-z0-9_-]{35}$/.test(match.value), "format");
    case "npm-token":
      return formatResult(/^npm_[A-Za-z0-9]{36}$/.test(match.value), "format");
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

  const builtinHints = ["example", "dummy", "fake", "sample", "not_secret", "replace_in_runtime_only", "docs_only"];
  const allHints = [...builtinHints, ...hints.map((h) => String(h).toLowerCase())];

  if (allHints.some((hint) => lowerSnippet.includes(hint))) return true;

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

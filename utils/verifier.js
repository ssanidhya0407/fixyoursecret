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

  const builtinHints = ["example", "dummy", "fake", "sample", "not_secret", "replace_in_runtime_only"];
  const allHints = [...builtinHints, ...hints.map((h) => String(h).toLowerCase())];

  if (allHints.some((hint) => lowerSnippet.includes(hint))) return true;

  if (
    match.rule === "generic-high-entropy" &&
    ["/test/", "/tests/", "/__tests__/", "/fixtures/", "/docs/"].some((segment) => lowerPath.includes(segment))
  ) {
    return true;
  }

  return false;
}

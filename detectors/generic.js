const TOKEN_REGEX = /[A-Za-z0-9_\-+=]{28,}/g;

export function detectGenericSecrets(content, options = {}) {
  const threshold = Number.isFinite(options.entropyThreshold) ? options.entropyThreshold : 3.8;
  const findings = [];
  for (const match of content.matchAll(TOKEN_REGEX)) {
    const value = match[0];
    if (!looksLikeHighEntropy(value, threshold)) continue;
    if (looksSafeCommonWord(value)) continue;
    if (looksLikeCodeIdentifier(value)) continue;
    if (!looksLikeSecretToken(value)) continue;

    findings.push({
      rule: "generic-high-entropy",
      issue: "Potential secret-like token detected",
      index: match.index ?? 0,
      value,
      type: "generic",
      confidence: "medium",
    });
  }
  return findings;
}

function looksLikeHighEntropy(value, threshold) {
  const entropy = shannonEntropy(value);
  const hasLower = /[a-z]/.test(value);
  const hasUpperOrSymbol = /[A-Z]/.test(value) || /[_\-+/=]/.test(value);
  const hasDigit = /\d/.test(value);
  const adjustedThreshold = value.length >= 40 ? threshold + 0.25 : threshold;
  return entropy >= adjustedThreshold && hasLower && hasUpperOrSymbol && hasDigit;
}

function looksSafeCommonWord(value) {
  const lower = value.toLowerCase();
  return (
    value.startsWith("sk-") ||
    value.startsWith("AIza") ||
    value.startsWith("pk_test_") ||
    value.startsWith("pk_live_") ||
    value.startsWith("http") ||
    value.includes("localhost") ||
    lower.includes("component") ||
    lower.includes("configuration") ||
    lower.includes("diagnostics") ||
    lower.includes("typescript")
  );
}

function looksLikeSecretToken(value) {
  if (/[/.:]/.test(value)) return false;
  if (value.includes("://")) return false;
  if (value.startsWith("www")) return false;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return false;

  const classes = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[_\-+/=]/.test(value),
  ].filter(Boolean).length;

  const digits = (value.match(/\d/g) || []).length;
  const hasLongHexOnly = /^[a-f0-9]{24,}$/i.test(value);
  const hasOnlyAlphaNum = /^[A-Za-z0-9]+$/.test(value);
  const symbolCount = (value.match(/[_\-+=]/g) || []).length;

  if (hasLongHexOnly && digits < 6) return false;
  if (classes < 3) return false;
  if (value.length >= 32 && digits < 2) return false;
  if (hasOnlyAlphaNum && value.length < 36) return false;
  if (value.length >= 36 && symbolCount === 0 && digits < 4) return false;
  return true;
}

function looksLikeCodeIdentifier(value) {
  if (/^[A-Za-z_][A-Za-z0-9_]{30,}$/.test(value)) return true;
  if (/^[A-Z][A-Za-z0-9]{20,}$/.test(value)) return true;
  if (/^[_A-Za-z0-9-]+$/.test(value) && value.includes("__")) return true;
  if (/^[A-Za-z]+(?:[A-Z][a-z0-9]+){2,}\d+$/.test(value)) return true;
  if (/(Api|Context|Request|Response|Migration|Oauth2|OAuth2|V1alpha1|Agentflow)/.test(value)) return true;

  const parts = value.split(/[_-]/).filter(Boolean);
  if (parts.length >= 4) {
    const alphaWords = parts.filter((p) => /^[A-Za-z]{3,}$/.test(p)).length;
    if (alphaWords / parts.length >= 0.6) return true;
  }

  const vowelCount = (value.match(/[aeiou]/gi) || []).length;
  const vowelRatio = vowelCount / value.length;
  if (vowelRatio > 0.42 && !/[_\-+/=]/.test(value)) return true;

  return false;
}

function shannonEntropy(value) {
  const map = new Map();
  for (const ch of value) {
    map.set(ch, (map.get(ch) || 0) + 1);
  }
  let entropy = 0;
  for (const count of map.values()) {
    const p = count / value.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

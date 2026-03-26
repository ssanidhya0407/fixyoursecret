const TOKEN_REGEX = /[A-Za-z0-9_\-]{24,}/g;

export function detectGenericSecrets(content, options = {}) {
  const threshold = Number.isFinite(options.entropyThreshold) ? options.entropyThreshold : 3.8;
  const findings = [];
  for (const match of content.matchAll(TOKEN_REGEX)) {
    const value = match[0];
    if (!looksLikeHighEntropy(value, threshold)) continue;
    if (looksSafeCommonWord(value)) continue;

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
  const hasUpperOrSymbol = /[A-Z]/.test(value) || /[_-]/.test(value);
  const hasDigit = /\d/.test(value);
  return entropy >= threshold && hasLower && hasUpperOrSymbol && hasDigit;
}

function looksSafeCommonWord(value) {
  return (
    value.startsWith("sk-") ||
    value.startsWith("AIza") ||
    value.startsWith("pk_test_") ||
    value.startsWith("pk_live_") ||
    value.startsWith("http") ||
    value.includes("localhost") ||
    value.toLowerCase().includes("component") ||
    value.toLowerCase().includes("configuration")
  );
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

const COHERE_REGEX = /\bco_[A-Za-z0-9]{30,}\b/g;

export function detectCohere(content) {
  const findings = [];
  for (const match of content.matchAll(COHERE_REGEX)) {
    findings.push({
      rule: "cohere-api-key",
      issue: "Cohere API key exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "cohere",
      confidence: "high",
    });
  }
  return findings;
}

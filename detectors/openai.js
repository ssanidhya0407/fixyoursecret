const OPENAI_REGEX = /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g;

export function detectOpenAI(content) {
  const findings = [];
  for (const match of content.matchAll(OPENAI_REGEX)) {
    findings.push({
      rule: "openai-key",
      issue: "OpenAI key exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "openai",
      confidence: "high",
    });
  }
  return findings;
}

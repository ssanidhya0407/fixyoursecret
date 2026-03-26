const ANTHROPIC_REGEX = /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g;

export function detectAnthropic(content) {
  const findings = [];
  for (const match of content.matchAll(ANTHROPIC_REGEX)) {
    findings.push({
      rule: "anthropic-api-key",
      issue: "Anthropic API key exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "anthropic",
      confidence: "high",
    });
  }
  return findings;
}

const OPENAI_REGEX = /(^|[^A-Za-z0-9_])(sk-(?:proj-)?[A-Za-z0-9_-]{24,})(?![A-Za-z0-9_-])/g;

export function detectOpenAI(content) {
  const findings = [];
  for (const match of content.matchAll(OPENAI_REGEX)) {
    const value = match[2];
    if (!value) continue;
    if (!/\d/.test(value)) continue;
    if (value.includes("--")) continue;
    findings.push({
      rule: "openai-key",
      issue: "OpenAI key exposed",
      index: (match.index ?? 0) + (match[1]?.length || 0),
      value,
      type: "openai",
      confidence: "high",
    });
  }
  return findings;
}

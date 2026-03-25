const SLACK_TOKEN_REGEX = /\bxox(?:b|p|a|r|s)-[0-9A-Za-z-]{10,}\b/g;

export function detectSlack(content) {
  const findings = [];
  for (const match of content.matchAll(SLACK_TOKEN_REGEX)) {
    findings.push({
      rule: "slack-token",
      issue: "Slack token exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "slack",
      confidence: "high",
    });
  }
  return findings;
}

const AWS_ACCESS_KEY_ID_REGEX = /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g;

export function detectAWS(content) {
  const findings = [];
  for (const match of content.matchAll(AWS_ACCESS_KEY_ID_REGEX)) {
    findings.push({
      rule: "aws-access-key-id",
      issue: "AWS access key ID exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "aws",
      confidence: "high",
    });
  }
  return findings;
}

const SENDGRID_REGEX = /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g;

export function detectSendGrid(content) {
  const findings = [];
  for (const match of content.matchAll(SENDGRID_REGEX)) {
    findings.push({
      rule: "sendgrid-api-key",
      issue: "SendGrid API key exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "sendgrid",
      confidence: "high",
    });
  }
  return findings;
}

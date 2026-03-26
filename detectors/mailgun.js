const MAILGUN_REGEX = /\bkey-[A-Za-z0-9]{32}\b/g;

export function detectMailgun(content) {
  const findings = [];
  for (const match of content.matchAll(MAILGUN_REGEX)) {
    findings.push({
      rule: "mailgun-api-key",
      issue: "Mailgun API key exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "mailgun",
      confidence: "high",
    });
  }
  return findings;
}

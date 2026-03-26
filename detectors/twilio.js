const TWILIO_KEY_REGEX = /\bSK[0-9a-fA-F]{32}\b/g;

export function detectTwilio(content) {
  const findings = [];
  for (const match of content.matchAll(TWILIO_KEY_REGEX)) {
    findings.push({
      rule: "twilio-api-key",
      issue: "Twilio API key exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "twilio",
      confidence: "high",
    });
  }
  return findings;
}

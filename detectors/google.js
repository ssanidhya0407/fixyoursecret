const GOOGLE_REGEX = /AIza[A-Za-z0-9_-]{35}/g;

export function detectGoogle(content) {
  const findings = [];
  for (const match of content.matchAll(GOOGLE_REGEX)) {
    findings.push({
      rule: "google-key",
      issue: "Google API key exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "google",
      confidence: "high",
    });
  }
  return findings;
}

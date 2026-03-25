const PRIVATE_KEY_REGEX = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g;

export function detectPrivateKey(content) {
  const findings = [];
  for (const match of content.matchAll(PRIVATE_KEY_REGEX)) {
    findings.push({
      rule: "private-key-block",
      issue: "Private key material exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "private-key",
      confidence: "high",
    });
  }
  return findings;
}

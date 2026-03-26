const NPM_REGEX = /\bnpm_[A-Za-z0-9]{36}\b/g;

export function detectNpmToken(content) {
  const findings = [];
  for (const match of content.matchAll(NPM_REGEX)) {
    findings.push({
      rule: "npm-token",
      issue: "npm token exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "npm",
      confidence: "high",
    });
  }
  return findings;
}

const GITHUB_TOKEN_REGEX = /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/g;

export function detectGitHub(content) {
  const findings = [];
  for (const match of content.matchAll(GITHUB_TOKEN_REGEX)) {
    findings.push({
      rule: "github-token",
      issue: "GitHub token exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "github",
      confidence: "high",
    });
  }
  return findings;
}

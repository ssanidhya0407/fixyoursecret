const GITLAB_REGEX = /\bglpat-[A-Za-z0-9_-]{20,}\b/g;

export function detectGitLab(content) {
  const findings = [];
  for (const match of content.matchAll(GITLAB_REGEX)) {
    findings.push({
      rule: "gitlab-token",
      issue: "GitLab token exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "gitlab",
      confidence: "high",
    });
  }
  return findings;
}

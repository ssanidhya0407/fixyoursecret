// User-defined detectors compiled from `customRules` in the config file. Each
// rule is a regex with an id, severity, and confidence, so teams can flag their
// own internal token formats without forking the tool. Rules are validated and
// normalized in utils/config.js before reaching here.

const cache = new WeakMap();

export function buildCustomDetectors(customRules = []) {
  if (!Array.isArray(customRules) || customRules.length === 0) return [];

  const cached = cache.get(customRules);
  if (cached) return cached;

  const detectors = [];
  for (const rule of customRules) {
    let regex;
    try {
      regex = new RegExp(rule.pattern, rule.flags);
    } catch {
      continue; // defensive: config normalization already dropped invalid patterns
    }

    detectors.push({
      key: rule.id,
      run: (content) => runRule(content, rule),
    });
  }

  cache.set(customRules, detectors);
  return detectors;
}

function runRule(content, rule) {
  // Fresh RegExp per scan so the global `lastIndex` never leaks across files.
  const regex = new RegExp(rule.pattern, rule.flags);
  const findings = [];

  for (const match of content.matchAll(regex)) {
    // If the rule defines a capture group, treat group 1 as the secret value
    // (and point the location at it); otherwise use the whole match.
    const hasGroup = match[1] !== undefined;
    const value = hasGroup ? match[1] : match[0];
    const offset = hasGroup ? Math.max(0, match[0].indexOf(match[1])) : 0;

    findings.push({
      rule: rule.id,
      issue: rule.issue,
      index: (match.index ?? 0) + offset,
      value,
      type: rule.id,
      confidence: rule.confidence,
      severity: rule.severity,
      isCustom: true,
    });
  }

  return findings;
}

const HF_REGEX = /\bhf_[A-Za-z0-9]{30,}\b/g;

export function detectHuggingFace(content) {
  const findings = [];
  for (const match of content.matchAll(HF_REGEX)) {
    findings.push({
      rule: "huggingface-token",
      issue: "Hugging Face token exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "huggingface",
      confidence: "high",
    });
  }
  return findings;
}

const STRIPE_SECRET_REGEX = /\bsk_live_[0-9A-Za-z]{16,}\b/g;

export function detectStripe(content) {
  const findings = [];
  for (const match of content.matchAll(STRIPE_SECRET_REGEX)) {
    findings.push({
      rule: "stripe-secret-key",
      issue: "Stripe secret key exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "stripe",
      confidence: "high",
    });
  }
  return findings;
}

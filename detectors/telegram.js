const TELEGRAM_REGEX = /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/g;

export function detectTelegram(content) {
  const findings = [];
  for (const match of content.matchAll(TELEGRAM_REGEX)) {
    findings.push({
      rule: "telegram-bot-token",
      issue: "Telegram bot token exposed",
      index: match.index ?? 0,
      value: match[0],
      type: "telegram",
      confidence: "high",
    });
  }
  return findings;
}

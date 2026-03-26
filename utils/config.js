import fs from "node:fs/promises";
import path from "node:path";

export const CONFIG_FILENAMES = [".fixyoursecretrc.json", ".secretlintrc.json"];
export const BASELINE_FILENAMES = [".fixyoursecret-baseline.json", ".secretlint-baseline.json"];

export const DEFAULT_CONFIG = {
  ignorePaths: ["node_modules/**", ".git/**", ".cache/**", "dist/**", "build/**", ".next/**", "coverage/**", "vendor/**", "tmp/**"],
  allowedExtensions: [".js", ".ts", ".jsx", ".tsx", ".env", ".swift"],
  maxFileSizeKB: 256,
  entropyThreshold: 3.8,
  failOn: "high",
  verifyMode: "none",
  suppressions: [
    { path: "test/" },
    { path: "tests/" },
    { path: "__tests__/" },
    { path: "fixtures/" }
  ],
  ignoreDetectors: [],
  ignoreValueHints: ["example", "dummy", "fake", "sample", "replace_in_runtime_only"],
};

export async function loadConfig(projectPath, configPath) {
  const candidates = configPath
    ? [path.resolve(configPath)]
    : CONFIG_FILENAMES.map((name) => path.join(projectPath, name));

  for (const candidate of candidates) {
    try {
      const raw = await fs.readFile(candidate, "utf8");
      const parsed = JSON.parse(raw);
      const config = {
        ...DEFAULT_CONFIG,
        ...parsed,
        ignorePaths: normalizeStringArray(parsed.ignorePaths, DEFAULT_CONFIG.ignorePaths),
        allowedExtensions: normalizeStringArray(parsed.allowedExtensions, DEFAULT_CONFIG.allowedExtensions),
        suppressions: normalizeSuppressions(parsed.suppressions),
        ignoreDetectors: normalizeStringArray(parsed.ignoreDetectors, DEFAULT_CONFIG.ignoreDetectors),
        ignoreValueHints: normalizeStringArray(parsed.ignoreValueHints, DEFAULT_CONFIG.ignoreValueHints),
        maxFileSizeKB: toPositiveInt(parsed.maxFileSizeKB, DEFAULT_CONFIG.maxFileSizeKB),
        entropyThreshold: toPositiveNumber(parsed.entropyThreshold, DEFAULT_CONFIG.entropyThreshold),
        failOn: normalizeFailOn(parsed.failOn, DEFAULT_CONFIG.failOn),
        verifyMode: normalizeVerifyMode(parsed.verifyMode, DEFAULT_CONFIG.verifyMode),
      };
      return { config, path: candidate, loaded: true };
    } catch {
      // try next config candidate
    }
  }

  return { config: { ...DEFAULT_CONFIG }, path: candidates[0], loaded: false };
}

export function resolveBaselinePath(projectPath, explicitBaselinePath) {
  if (explicitBaselinePath) return path.resolve(projectPath, explicitBaselinePath);
  return path.resolve(projectPath, BASELINE_FILENAMES[0]);
}

export function isSuppressed(finding, suppressions = [], fileLines = []) {
  if (hasInlineDisable(fileLines, finding.line)) return true;
  return suppressions.some((rule) => {
    if (!rule || typeof rule !== "object") return false;
    if (rule.rule && rule.rule !== finding.rule) return false;
    if (rule.path && !finding.file.includes(String(rule.path))) return false;
    if (rule.line && Number(rule.line) !== finding.line) return false;
    return true;
  });
}

function hasInlineDisable(lines, currentLine) {
  const previous = lines[currentLine - 2] || "";
  const current = lines[currentLine - 1] || "";
  return (
    /secretlint-disable-next-line|fixyoursecret-disable-next-line/.test(previous) ||
    /secretlint-disable-line|fixyoursecret-disable-line/.test(current)
  );
}

function normalizeSuppressions(value) {
  if (!Array.isArray(value)) return DEFAULT_CONFIG.suppressions;
  return value.filter((item) => item && typeof item === "object");
}

function normalizeStringArray(value, fallback) {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string") : fallback;
}

function toPositiveInt(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function toPositiveNumber(value, fallback) {
  return typeof value === "number" && value > 0 ? value : fallback;
}

function normalizeFailOn(value, fallback) {
  const safe = String(value || "").toLowerCase();
  return ["low", "medium", "high"].includes(safe) ? safe : fallback;
}

function normalizeVerifyMode(value, fallback) {
  const safe = String(value || "").toLowerCase();
  return ["none", "safe"].includes(safe) ? safe : fallback;
}

export function defaultConfigTemplate() {
  return JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n";
}

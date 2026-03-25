import fs from "node:fs/promises";
import path from "node:path";
import { detectOpenAI } from "../detectors/openai.js";
import { detectGoogle } from "../detectors/google.js";
import { detectGenericSecrets } from "../detectors/generic.js";
import { collectProjectFiles, lineColFromIndex } from "../utils/fileScanner.js";
import { analyzeRisk } from "../utils/riskAnalyzer.js";
import { printFinding, printSummary, logger } from "../utils/logger.js";
import { findingsToSarif } from "../utils/sarif.js";
import { getRecentChangedFiles, getStagedFiles, getTrackedFiles } from "../utils/gitScanner.js";
import { isSuppressed, loadConfig } from "../utils/config.js";

const SCORE = { LOW: 1, MEDIUM: 2, HIGH: 3 };

export async function runScan(options = {}) {
  const projectPath = path.resolve(options.path || process.cwd());
  const cfgLoad = await loadConfig(projectPath, options.config);
  const config = cfgLoad.config;

  const includeOnly = await resolveScanScope(projectPath, options);

  const files = await collectProjectFiles(projectPath, {
    allowedExtensions: config.allowedExtensions,
    ignorePaths: config.ignorePaths,
    maxFileSizeKB: config.maxFileSizeKB,
    includeOnly,
  });

  const findings = [];

  for (const file of files) {
    const detectorRuns = [
      !config.ignoreDetectors.includes("openai") ? detectOpenAI(file.content) : [],
      !config.ignoreDetectors.includes("google") ? detectGoogle(file.content) : [],
      !config.ignoreDetectors.includes("generic")
        ? detectGenericSecrets(file.content, { entropyThreshold: config.entropyThreshold })
        : [],
    ];

    for (const matches of detectorRuns) {
      for (const match of matches) {
        const { line, column } = lineColFromIndex(file.content, match.index);
        const snippet = file.lines[line - 1]?.trim() || "";
        const risk = analyzeRisk(file.relativePath, match, snippet);

        const finding = {
          file: file.relativePath,
          line,
          column,
          issue: match.issue,
          rule: match.rule,
          severity: risk.severity,
          reason: risk.reason,
          snippet: snippet.slice(0, 180),
          recommendation: risk.fix,
        };

        if (isSuppressed(finding, config.suppressions, file.lines)) continue;
        findings.push(finding);
      }
    }
  }

  const deduped = dedupeFindings(findings);
  const filtered = await applyBaselineFilter(projectPath, deduped, options);

  await maybeUpdateBaseline(projectPath, deduped, options);

  const format = normalizeFormat(options.format, options.json);
  await emitOutput(filtered, format, options.outputFile);

  if (format === "text") {
    if (filtered.length === 0) {
      logger.safe("No leaked secrets detected.");
    } else {
      for (const finding of filtered) printFinding(finding);
      printSummary(filtered);
    }
    if (cfgLoad.loaded) logger.log(`Config: ${cfgLoad.path}`);
  }

  return shouldFail(filtered, options.failOn || config.failOn || "high") ? 1 : 0;
}

async function resolveScanScope(projectPath, options) {
  if (options.staged) return getStagedFiles(projectPath);
  if (options.tracked) return getTrackedFiles(projectPath);
  if (options.history) return getRecentChangedFiles(projectPath, Number(options.history));
  return null;
}

function dedupeFindings(findings) {
  const seen = new Set();
  const out = [];

  for (const f of findings) {
    const key = `${f.file}:${f.line}:${f.rule}:${f.snippet}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(f);
    }
  }

  return out;
}

async function applyBaselineFilter(projectPath, findings, options) {
  const baselinePath = path.resolve(projectPath, options.baseline || ".secretlint-baseline.json");
  if (options.noBaseline) return findings;

  let baselineSet = null;
  try {
    const raw = await fs.readFile(baselinePath, "utf8");
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      baselineSet = new Set(list.filter((v) => typeof v === "string"));
    }
  } catch {
    baselineSet = null;
  }

  if (!baselineSet) return findings;
  return findings.filter((f) => !baselineSet.has(fingerprint(f)));
}

async function maybeUpdateBaseline(projectPath, findings, options) {
  if (!options.updateBaseline) return;
  const baselinePath = path.resolve(projectPath, options.baseline || ".secretlint-baseline.json");
  const entries = findings.map((f) => fingerprint(f)).sort();
  await fs.writeFile(baselinePath, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

async function emitOutput(findings, format, outputFile) {
  if (format === "json") {
    const payload = JSON.stringify(findings, null, 2);
    return writeOrPrint(payload, outputFile);
  }

  if (format === "sarif") {
    const payload = JSON.stringify(findingsToSarif(findings), null, 2);
    return writeOrPrint(payload, outputFile);
  }
}

async function writeOrPrint(payload, outputFile) {
  if (outputFile) {
    await fs.writeFile(path.resolve(outputFile), payload + "\n", "utf8");
  } else {
    logger.log(payload);
  }
}

function normalizeFormat(format, jsonFlag) {
  if (jsonFlag) return "json";
  const safe = String(format || "text").toLowerCase();
  return ["text", "json", "sarif"].includes(safe) ? safe : "text";
}

function shouldFail(findings, failOn) {
  const threshold = toSeverityLabel(failOn);
  const thresholdScore = SCORE[threshold];
  return findings.some((f) => SCORE[f.severity] >= thresholdScore);
}

function toSeverityLabel(value) {
  const safe = String(value || "high").toUpperCase();
  if (safe === "LOW") return "LOW";
  if (safe === "MEDIUM") return "MEDIUM";
  return "HIGH";
}

function fingerprint(f) {
  return `${f.file}:${f.line}:${f.rule}:${f.snippet}`;
}

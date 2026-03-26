#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

const reportPath = path.resolve(cwd, args.report || "docs/tuning/report-500.json");
const thresholdsPath = path.resolve(cwd, args.thresholds || "fixtures/tuning/regression-thresholds.json");

const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
const thresholds = JSON.parse(await fs.readFile(thresholdsPath, "utf8"));

const summary = report.summary || {};
const topRules = new Map((summary.topRules || []).map((r) => [r.rule, r.count]));

const genericCount = topRules.get("generic-high-entropy") || 0;
const githubCount = topRules.get("github-token") || 0;
const slackCount = topRules.get("slack-token") || 0;

const checks = [
  { name: "findingsTotal", value: Number(summary.findingsTotal || 0), max: thresholds.maxFindingsTotal },
  { name: "high", value: Number(summary.high || 0), max: thresholds.maxHigh },
  { name: "genericHighEntropy", value: genericCount, max: thresholds.maxGenericHighEntropy },
  { name: "githubToken", value: githubCount, max: thresholds.maxGithubToken },
  { name: "slackToken", value: slackCount, max: thresholds.maxSlackToken },
];

let failed = false;
console.log("FixYourSecret Tuning Regression Check");
console.log(`- report: ${reportPath}`);
console.log(`- thresholds: ${thresholdsPath}`);

for (const check of checks) {
  if (typeof check.max !== "number") continue;
  const pass = check.value <= check.max;
  console.log(`- ${check.name}: ${check.value} (max ${check.max}) => ${pass ? "PASS" : "FAIL"}`);
  if (!pass) failed = true;
}

if (failed) {
  console.error("Regression gate failed.");
  process.exit(1);
}

console.log("Regression gate passed.");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    out[key] = value;
  }
  return out;
}

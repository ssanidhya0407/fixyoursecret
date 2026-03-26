#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { runScan } from "../commands/scan.js";

const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

const reposFile = path.resolve(cwd, args["repos-file"] || "fixtures/tuning/repos.default.json");
const outputFile = path.resolve(cwd, args.output || "docs/tuning/multi-repo-report.json");
const fpReviewFile = path.resolve(cwd, args["fp-review"] || "docs/tuning/false-positive-review.md");
const failOnHigh = toInt(args["fail-on-high"], -1);

const repos = await loadRepos(reposFile);
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "fixyoursecret-tune-"));

const perRepo = [];
const allFindings = [];

for (const repo of repos) {
  const repoPath = path.resolve(cwd, repo.path);
  const exists = await pathExists(repoPath);
  if (!exists) {
    perRepo.push({ name: repo.name, path: repo.path, skipped: true, reason: "path-not-found" });
    continue;
  }

  const outPath = path.join(tempDir, `${sanitize(repo.name)}.json`);
  const exitCode = await runScan({
    path: repoPath,
    format: "json",
    outputFile: outPath,
    noBaseline: true,
    verify: "safe",
  });

  const findings = JSON.parse(await fs.readFile(outPath, "utf8"));
  for (const f of findings) {
    allFindings.push({ ...f, repo: repo.name, repoPath: repo.path });
  }

  perRepo.push({
    name: repo.name,
    path: repo.path,
    skipped: false,
    exitCode,
    findings: findings.length,
    high: findings.filter((f) => f.severity === "HIGH").length,
    medium: findings.filter((f) => f.severity === "MEDIUM").length,
    low: findings.filter((f) => f.severity === "LOW").length,
    topRules: topRules(findings),
  });
}

const summary = {
  reposTotal: repos.length,
  reposScanned: perRepo.filter((r) => !r.skipped).length,
  reposSkipped: perRepo.filter((r) => r.skipped).length,
  findingsTotal: allFindings.length,
  high: allFindings.filter((f) => f.severity === "HIGH").length,
  medium: allFindings.filter((f) => f.severity === "MEDIUM").length,
  low: allFindings.filter((f) => f.severity === "LOW").length,
  uniqueRules: [...new Set(allFindings.map((f) => f.rule))].length,
  topRules: topRules(allFindings),
};

const report = {
  generatedAt: new Date().toISOString(),
  reposFile,
  summary,
  perRepo,
};

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, JSON.stringify(report, null, 2) + "\n", "utf8");

await fs.mkdir(path.dirname(fpReviewFile), { recursive: true });
await fs.writeFile(fpReviewFile, renderFalsePositiveQueue(allFindings), "utf8");

console.log("FixYourSecret Multi-Repo Tuning");
console.log(`- repos scanned: ${summary.reposScanned}/${summary.reposTotal}`);
console.log(`- findings total: ${summary.findingsTotal} (high=${summary.high}, medium=${summary.medium}, low=${summary.low})`);
console.log(`- report: ${outputFile}`);
console.log(`- false-positive queue: ${fpReviewFile}`);

if (failOnHigh >= 0 && summary.high > failOnHigh) {
  console.error(`High-risk findings ${summary.high} exceeded threshold ${failOnHigh}`);
  process.exit(1);
}

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

async function loadRepos(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("repos file must be a JSON array");
  }
  return parsed.map((repo, idx) => ({
    name: typeof repo.name === "string" ? repo.name : `repo-${idx + 1}`,
    path: String(repo.path || ""),
  }));
}

function topRules(findings) {
  const map = new Map();
  for (const f of findings) {
    map.set(f.rule, (map.get(f.rule) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([rule, count]) => ({ rule, count }));
}

function renderFalsePositiveQueue(findings) {
  const header = [
    "# False Positive Review Queue",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Review each row and mark `status` as `confirmed-secret` or `false-positive`.",
    "",
    "| status | repo | file | line | rule | snippet |",
    "|---|---|---|---:|---|---|",
  ];

  const rows = findings.slice(0, 200).map((f) => {
    const snippet = String(f.snippet || "").replaceAll("|", "\\|").slice(0, 120);
    return `| todo | ${f.repo} | ${f.file} | ${f.line} | ${f.rule} | ${snippet} |`;
  });

  if (rows.length === 0) {
    rows.push("| n/a | n/a | n/a | 0 | n/a | no findings | ");
  }

  return [...header, ...rows, ""].join("\n");
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function sanitize(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "repo";
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

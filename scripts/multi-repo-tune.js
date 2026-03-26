#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const args = parseArgs(process.argv.slice(2));
const cwd = process.cwd();

const reposFile = path.resolve(cwd, args["repos-file"] || "fixtures/tuning/repos.default.json");
const outputFile = path.resolve(cwd, args.output || "docs/tuning/multi-repo-report.json");
const fpReviewFile = path.resolve(cwd, args["fp-review"] || "docs/tuning/false-positive-review.md");
const workspace = path.resolve(args.workspace || path.join(os.tmpdir(), "fixyoursecret-tuning-repos"));
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "fixyoursecret-tune-"));
const maxRepos = toInt(args["max-repos"], Number.POSITIVE_INFINITY);
const failOnHigh = toInt(args["fail-on-high"], -1);
const cloneDepth = toInt(args["clone-depth"], 1);
const concurrency = Math.max(1, toInt(args.concurrency, Math.max(2, os.cpus().length - 1)));
const verifyMode = ["none", "safe"].includes(String(args.verify || "safe")) ? String(args.verify || "safe") : "safe";

const repos = (await loadRepos(reposFile)).slice(0, maxRepos);
await fs.mkdir(workspace, { recursive: true });

console.log("FixYourSecret Large-Scale Multi-Repo Tuning");
console.log(`- repos file: ${reposFile}`);
console.log(`- workspace: ${workspace}`);
console.log(`- repos selected: ${repos.length}`);
console.log(`- concurrency: ${concurrency}`);
console.log(`- verify mode: ${verifyMode}`);

const prepared = await runPool(repos, concurrency, async (repo) => prepareRepo(repo, workspace, cloneDepth));
const readyRepos = prepared.filter((p) => !p.skipped);

console.log(`- repos ready for scan: ${readyRepos.length}`);

const scanResults = await runPool(readyRepos, concurrency, async (repo) => scanRepo(repo, tempDir, verifyMode, cwd));

const allFindings = [];
const perRepo = [];
for (const result of scanResults) {
  if (result.skipped) {
    perRepo.push(result);
    continue;
  }

  for (const finding of result.findings) {
    allFindings.push({ ...finding, repo: result.name, repoPath: result.path, source: result.source });
  }

  perRepo.push({
    name: result.name,
    path: result.path,
    source: result.source,
    skipped: false,
    cloneStatus: result.cloneStatus,
    scanExitCode: result.scanExitCode,
    findings: result.findings.length,
    high: result.findings.filter((f) => f.severity === "HIGH").length,
    medium: result.findings.filter((f) => f.severity === "MEDIUM").length,
    low: result.findings.filter((f) => f.severity === "LOW").length,
    topRules: topRules(result.findings),
  });
}

const summary = {
  reposTotal: repos.length,
  reposPrepared: prepared.filter((r) => !r.skipped).length,
  reposScanned: perRepo.filter((r) => !r.skipped).length,
  reposSkipped: perRepo.filter((r) => r.skipped).length,
  findingsTotal: allFindings.length,
  high: allFindings.filter((f) => f.severity === "HIGH").length,
  medium: allFindings.filter((f) => f.severity === "MEDIUM").length,
  low: allFindings.filter((f) => f.severity === "LOW").length,
  uniqueRules: [...new Set(allFindings.map((f) => f.rule))].length,
  topRules: topRules(allFindings),
  topReposByFindings: perRepo
    .filter((r) => !r.skipped)
    .sort((a, b) => b.findings - a.findings)
    .slice(0, 15)
    .map((r) => ({ name: r.name, findings: r.findings, high: r.high })),
};

const report = {
  generatedAt: new Date().toISOString(),
  machine: {
    platform: os.platform(),
    release: os.release(),
    cpuCount: os.cpus().length,
    totalMemGB: Number((os.totalmem() / (1024 ** 3)).toFixed(1)),
  },
  config: {
    reposFile,
    workspace,
    concurrency,
    verifyMode,
    cloneDepth,
  },
  summary,
  perRepo,
};

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, JSON.stringify(report, null, 2) + "\n", "utf8");

await fs.mkdir(path.dirname(fpReviewFile), { recursive: true });
await fs.writeFile(fpReviewFile, renderFalsePositiveQueue(allFindings), "utf8");

console.log(`- findings total: ${summary.findingsTotal} (high=${summary.high}, medium=${summary.medium}, low=${summary.low})`);
console.log(`- unique rules hit: ${summary.uniqueRules}`);
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

  return parsed.map((repo, idx) => {
    const name = typeof repo.name === "string" && repo.name.trim() ? repo.name.trim() : `repo-${idx + 1}`;
    const source = typeof repo.url === "string" && repo.url.trim() ? repo.url.trim() : "";
    const localPath = typeof repo.path === "string" && repo.path.trim() ? repo.path.trim() : "";

    if (!source && !localPath) {
      throw new Error(`repo ${name} must have either \"url\" or \"path\"`);
    }

    return {
      name,
      url: source,
      path: localPath,
      branch: typeof repo.branch === "string" ? repo.branch : "",
    };
  });
}

async function prepareRepo(repo, repoWorkspace, depth) {
  if (repo.path) {
    const resolved = path.resolve(cwd, repo.path);
    const exists = await pathExists(resolved);
    if (!exists) {
      return { name: repo.name, path: repo.path, source: "local", skipped: true, reason: "path-not-found" };
    }
    return { name: repo.name, path: resolved, source: "local", skipped: false, cloneStatus: "local" };
  }

  const dirName = sanitize(repo.name);
  const targetPath = path.join(repoWorkspace, dirName);
  const exists = await pathExists(path.join(targetPath, ".git"));

  try {
    if (!exists) {
      const cloneArgs = ["clone", "--depth", String(depth), repo.url, targetPath];
      if (repo.branch) cloneArgs.splice(2, 0, "--branch", repo.branch);
      await runGit(cloneArgs);
      return { name: repo.name, path: targetPath, source: repo.url, skipped: false, cloneStatus: "cloned" };
    }

    await runGit(["-C", targetPath, "fetch", "--depth", String(depth), "origin"]);
    await runGit(["-C", targetPath, "reset", "--hard", "FETCH_HEAD"]);
    return { name: repo.name, path: targetPath, source: repo.url, skipped: false, cloneStatus: "updated" };
  } catch (error) {
    return { name: repo.name, path: targetPath, source: repo.url, skipped: true, reason: `clone-failed:${error.message}` };
  }
}

async function scanRepo(repo, tempDirPath, verify, projectRoot) {
  const outputPath = path.join(tempDirPath, `${sanitize(repo.name)}.json`);
  const binPath = path.join(projectRoot, "bin", "index.js");

  try {
    const args = [
      binPath,
      "scan",
      "--path",
      repo.path,
      "--format",
      "json",
      "--output-file",
      outputPath,
      "--no-baseline",
      "--verify",
      verify,
      "--fail-on",
      "high",
    ];

    let scanExitCode = 0;
    try {
      await execFileAsync(process.execPath, args, { cwd: projectRoot, maxBuffer: 16 * 1024 * 1024 });
    } catch (error) {
      scanExitCode = Number(error.code || 1);
      if (!(await pathExists(outputPath))) {
        throw error;
      }
    }

    const raw = await fs.readFile(outputPath, "utf8");
    const findings = JSON.parse(raw);
    return {
      ...repo,
      skipped: false,
      scanExitCode,
      findings: Array.isArray(findings) ? findings : [],
    };
  } catch (error) {
    return {
      name: repo.name,
      path: repo.path,
      source: repo.source,
      skipped: true,
      reason: `scan-failed:${error.message}`,
    };
  }
}

async function runGit(args) {
  await execFileAsync("git", args, { maxBuffer: 8 * 1024 * 1024 });
}

async function runPool(items, limit, worker) {
  const queue = [...items];
  const results = [];

  const workers = Array.from({ length: Math.min(limit, queue.length || 1) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      const startedAt = Date.now();
      const result = await worker(item);
      const durationMs = Date.now() - startedAt;
      results.push({ ...result, durationMs });
      const status = result.skipped ? `skipped (${result.reason || "unknown"})` : "ok";
      console.log(`[${item.name}] ${status} in ${(durationMs / 1000).toFixed(1)}s`);
    }
  });

  await Promise.all(workers);
  return results;
}

function topRules(findings) {
  const map = new Map();
  for (const f of findings) {
    map.set(f.rule, (map.get(f.rule) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([rule, count]) => ({ rule, count }));
}

function renderFalsePositiveQueue(findings) {
  const grouped = new Map();
  for (const finding of findings) {
    const key = `${finding.rule}::${finding.file}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(finding);
  }

  const rows = [...grouped.values()]
    .sort((a, b) => b.length - a.length)
    .slice(0, 300)
    .map((bucket) => {
      const f = bucket[0];
      const snippet = String(f.snippet || "").replaceAll("|", "\\|").slice(0, 120);
      return `| todo | ${f.rule} | ${bucket.length} | ${f.repo} | ${f.file} | ${f.line} | ${snippet} |`;
    });

  const header = [
    "# False Positive Review Queue (Large Dataset)",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Review each row and set `status` to `confirmed-secret` or `false-positive`.",
    "",
    "| status | rule | occurrences | sample-repo | sample-file | sample-line | sample-snippet |",
    "|---|---|---:|---|---|---:|---|",
  ];

  if (rows.length === 0) {
    rows.push("| n/a | n/a | 0 | n/a | n/a | 0 | no findings | ");
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

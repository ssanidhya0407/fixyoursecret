#!/usr/bin/env node
// Labeled-corpus benchmark: measures TRUE precision/recall/F1 against ground
// truth, unlike the multi-repo tuner which only counts findings for FP review.
//
// It generates a temp project where every planted secret has a known location
// and rule (the positives), alongside realistic hard negatives (hashes, UUIDs,
// data URIs, model names, example keys) that must produce zero findings. The
// real scanner CLI is run end-to-end, then findings are scored against the
// manifest.
//
// Optional --repos-file <json> additionally clones real public repos and folds
// their findings into the false-positive count for real-world precision; it is
// skipped gracefully if cloning is unavailable.
//
// Usage:
//   node scripts/benchmark-corpus.js
//   node scripts/benchmark-corpus.js --report docs/benchmark/corpus-report.json
//   node scripts/benchmark-corpus.js --min-precision 0.95 --min-recall 0.95
//   node scripts/benchmark-corpus.js --repos-file fixtures/tuning/repos.large.json --max-repos 25

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const cwd = process.cwd();
const args = parseArgs(process.argv.slice(2));

const reportFile = args.report ? path.resolve(cwd, args.report) : path.resolve(cwd, "docs/benchmark/corpus-report.json");
const minPrecision = toNum(args["min-precision"], 0.95);
const minRecall = toNum(args["min-recall"], 0.95);
const reposFile = args["repos-file"] ? path.resolve(cwd, args["repos-file"]) : null;
const maxRepos = toInt(args["max-repos"], 25);
const cliEntry = path.resolve(cwd, "bin/index.js");

// ---- Ground truth -------------------------------------------------------

// Each planted secret: realistic provider format, spread across file types and
// frontend/backend paths so the benchmark also exercises coverage + risk logic.
// Values are stored as `parts` joined at runtime so no complete token literal
// lives in source — this keeps GitHub push protection (and our own scanner)
// from flagging the benchmark file itself, matching the fixtures' convention.
const PLANTED = [
  { rule: "openai-key", file: "src/App.jsx", parts: ["sk-proj-", "Ab3dEf7Hj9KmNpQrTu2Wx5Yz8Cv1Bn4"] },
  { rule: "google-key", file: "app/maps.js", parts: ["AIza", "SyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r"] },
  { rule: "aws-access-key-id", file: "server/aws_config.py", parts: ["AKIA", "2X4Y6Z8A1B3C5D7E"] },
  { rule: "stripe-secret-key", file: "services/billing.go", parts: ["sk_", "live_", "4Eu1Bn7Hj9KmNpQrTu2Wx5Y"] },
  { rule: "slack-token", file: "config/slack.yml", parts: ["xox", "b-2456789012-3Ab7Hj9KmNpQrTu2Wx5Y"] },
  { rule: "github-token", file: "scripts/deploy.sh", parts: ["ghp", "_Ab3dEf7Hj9KmNpQrTu2Wx5Yz8Cv1Bn4Ml6"] },
  { rule: "gitlab-token", file: "ci/gitlab.yml", parts: ["glpat", "-Ab3dEf7Hj9KmNpQrTu23"] },
  { rule: "twilio-api-key", file: "server/twilio.rb", parts: ["SK", "0123456789abcdef0123456789abcdef"] },
  { rule: "sendgrid-api-key", file: "config/mail.properties", parts: ["SG", ".Ab3dEf7Hj9KmNpQrTu2Wx.", "5Yz8Cv1Bn4Ml6Pk0RsTuVwXyZaBcDeFgHjKmNpQrT"] },
  { rule: "mailgun-api-key", file: "server/mailer.php", parts: ["key-", "0123456789abcdef0123456789abcdef"] },
  { rule: "anthropic-api-key", file: "src/ai.ts", parts: ["sk-ant", "-Ab3dEf7Hj9KmNpQrTu2Wx5Y"] },
  { rule: "cohere-api-key", file: "server/cohere.java", parts: ["co_", "Ab3dEf7Hj9KmNpQrTu2Wx5Yz8Cv1Bn4"] },
  { rule: "huggingface-token", file: "ml/hf.py", parts: ["hf_", "Ab3dEf7Hj9KmNpQrTu2Wx5Yz8Cv1Bn4"] },
  { rule: "telegram-bot-token", file: "bots/telegram.js", parts: ["246813579", ":Ab3dEf7Hj9KmNpQrTu2Wx5Yz8Cv1Bn4Ml6P"] },
  { rule: "npm-token", file: "scripts/publish.sh", parts: ["npm", "_Ab3dEf7Hj9KmNpQrTu2Wx5Yz8Cv1Bn4Ml6Pk"] },
];

// Realistic high-entropy NON-secrets that historically trip naive scanners.
const NEGATIVES = [
  { file: "src/hash.js", content: 'const sha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";\n' },
  { file: "src/id.js", content: 'const uuid = "550e8400-e29b-41d4-a716-446655440000";\n' },
  { file: "src/model.js", content: 'const model = "gpt-4o-realtime-preview-2024-10-01";\n' },
  { file: "src/pkg.js", content: 'import det from "i18next-browser-languagedetector";\n' },
  { file: "src/asset.css", content: 'background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ");\n' },
  { file: "config/public.js", content: 'const pk = "pk_test_1234567890abcdefghijklmnopqrstuvwxyz";\n' },
  { file: "src/example.js", content: 'const demo = "' + "AKIA" + 'IOSFODNN7EXAMPLE";\n' },
  { file: "src/url.js", content: 'const cdn = "https://lh3.googleusercontent.com/aZxKmPq2RtVw8LnB4cDeFgHj";\n' },
  { file: "src/identifier.js", content: 'const getUserConfigurationFromRemoteServiceProvider = () => {};\n' },
  { file: "config/build.json", content: '{ "buildId": "build_configuration_identifier_for_documentation_2026" }\n' },
];

// ---- Run ----------------------------------------------------------------

async function main() {
  const project = await fs.mkdtemp(path.join(os.tmpdir(), "fixyoursecret-corpus-"));
  const expected = await writeCorpus(project);

  const findings = await scanProject(project);

  // Score planted secrets.
  let tp = 0;
  const missed = [];
  const matchedKeys = new Set();
  for (const plant of expected) {
    const hit = findings.find((f) =>
      normalize(f.file) === plant.file &&
      (f.rule === plant.rule || (f.snippet || "").includes(plant.value))
    );
    if (hit) {
      tp += 1;
      matchedKeys.add(`${normalize(hit.file)}:${hit.line}:${hit.rule}`);
    } else {
      missed.push(plant);
    }
  }

  // Any finding not explaining a planted secret is a false positive.
  const falsePositives = findings.filter((f) => {
    const key = `${normalize(f.file)}:${f.line}:${f.rule}`;
    if (matchedKeys.has(key)) return false;
    return !expected.some((p) => normalize(f.file) === p.file && (f.snippet || "").includes(p.value));
  });

  // Optional real-repo false-positive extension.
  const real = reposFile ? await scanRealRepos() : null;
  const realFp = real ? real.findingCount : 0;

  const fn = missed.length;
  const fp = falsePositives.length + realFp;
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  const report = {
    generatedFrom: "scripts/benchmark-corpus.js",
    corpus: { planted: expected.length, negativeFiles: NEGATIVES.length },
    realRepos: real ? { scanned: real.scanned, skipped: real.skipped, files: real.fileCount, findings: realFp } : null,
    counts: { truePositives: tp, falseNegatives: fn, falsePositives: fp, syntheticFp: falsePositives.length, realFp },
    metrics: {
      precision: round(precision),
      recall: round(recall),
      f1: round(f1),
    },
    missed: missed.map((m) => ({ rule: m.rule, file: m.file })),
    falsePositiveSamples: falsePositives.slice(0, 20).map((f) => ({ file: f.file, line: f.line, rule: f.rule, snippet: f.snippet })),
  };

  await fs.mkdir(path.dirname(reportFile), { recursive: true });
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2) + "\n", "utf8");

  printSummary(report);
  await fs.rm(project, { recursive: true, force: true });

  if (precision < minPrecision || recall < minRecall) {
    console.error(`\nGate FAILED. Required precision>=${minPrecision} recall>=${minRecall}.`);
    process.exit(1);
  }
  console.log("\nGate passed.");
}

async function writeCorpus(project) {
  const expected = [];
  for (const plant of PLANTED) {
    const value = plant.parts.join("");
    const abs = path.join(project, plant.file);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, `const credential = "${value}";\n`, "utf8");
    expected.push({ rule: plant.rule, file: normalize(plant.file), value });
  }
  for (const neg of NEGATIVES) {
    const abs = path.join(project, neg.file);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, neg.content, "utf8");
  }
  return expected;
}

async function scanProject(project) {
  const out = path.join(project, "__corpus_report.json");
  try {
    await execFileAsync("node", [cliEntry, "scan", "--path", project, "--format", "json", "--output-file", out, "--no-baseline"], { maxBuffer: 64 * 1024 * 1024 });
  } catch {
    // non-zero exit (findings present) is expected; the report file is still written
  }
  try {
    return JSON.parse(await fs.readFile(out, "utf8"));
  } catch {
    return [];
  }
}

async function scanRealRepos() {
  let repos;
  try {
    repos = JSON.parse(await fs.readFile(reposFile, "utf8")).filter((r) => r.url).slice(0, maxRepos);
  } catch {
    return { scanned: 0, skipped: 0, fileCount: 0, findingCount: 0 };
  }

  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "fixyoursecret-corpus-real-"));
  let scanned = 0, skipped = 0, fileCount = 0, findingCount = 0;

  for (const repo of repos) {
    const dest = path.join(workspace, String(repo.name || scanned + skipped));
    try {
      await execFileAsync("git", ["clone", "--depth", "1", "--quiet", repo.url, dest], { timeout: 60000 });
    } catch {
      skipped += 1;
      continue;
    }
    const out = path.join(dest, "__report.json");
    try {
      await execFileAsync("node", [cliEntry, "scan", "--path", dest, "--format", "json", "--output-file", out, "--no-baseline", "--verify", "safe"], { maxBuffer: 64 * 1024 * 1024 });
    } catch { /* findings exit code */ }
    try {
      const f = JSON.parse(await fs.readFile(out, "utf8"));
      findingCount += f.length;
    } catch { /* ignore */ }
    scanned += 1;
  }

  await fs.rm(workspace, { recursive: true, force: true });
  return { scanned, skipped, fileCount, findingCount };
}

function printSummary(r) {
  console.log("FixYourSecret Labeled-Corpus Benchmark");
  console.log(`- planted secrets:    ${r.corpus.planted}`);
  console.log(`- negative files:     ${r.corpus.negativeFiles}`);
  if (r.realRepos) {
    console.log(`- real repos scanned: ${r.realRepos.scanned} (skipped ${r.realRepos.skipped}), findings: ${r.realRepos.findings}`);
  }
  console.log(`- true positives:     ${r.counts.truePositives}`);
  console.log(`- false negatives:    ${r.counts.falseNegatives}`);
  console.log(`- false positives:    ${r.counts.falsePositives} (synthetic ${r.counts.syntheticFp}, real ${r.counts.realFp})`);
  console.log(`- precision:          ${r.metrics.precision.toFixed(3)}`);
  console.log(`- recall:             ${r.metrics.recall.toFixed(3)}`);
  console.log(`- f1:                 ${r.metrics.f1.toFixed(3)}`);
  if (r.missed.length) {
    console.log("- missed:");
    for (const m of r.missed) console.log(`  - ${m.rule} (${m.file})`);
  }
  if (r.falsePositiveSamples.length) {
    console.log("- false-positive samples:");
    for (const f of r.falsePositiveSamples) console.log(`  - ${f.file}:${f.line} ${f.rule}`);
  }
  console.log(`- report: ${path.relative(cwd, reportFile)}`);
}

function normalize(p) {
  return String(p || "").split(path.sep).join("/");
}
function round(n) {
  return Math.round(n * 1000) / 1000;
}
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) { out[key] = next; i += 1; }
      else out[key] = true;
    }
  }
  return out;
}
function toNum(v, d) { const n = Number(v); return Number.isFinite(n) ? n : d; }
function toInt(v, d) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; }

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

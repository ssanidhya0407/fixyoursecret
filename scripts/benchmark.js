#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { runDetectors } from "../utils/detectorRunner.js";
import { DEFAULT_CONFIG } from "../utils/config.js";
import { shouldSkipAsNonSecret } from "../utils/verifier.js";

const cwd = process.cwd();
const posPath = path.join(cwd, "fixtures/benchmark/positive.json");
const negPath = path.join(cwd, "fixtures/benchmark/negative.json");

const minRecall = Number(process.env.BENCH_MIN_RECALL || "0.95");
const minPrecision = Number(process.env.BENCH_MIN_PRECISION || "0.95");

const positives = JSON.parse(await fs.readFile(posPath, "utf8"));
const negatives = JSON.parse(await fs.readFile(negPath, "utf8"));

const cfg = {
  ...DEFAULT_CONFIG,
  ignoreDetectors: [],
};

let tp = 0;
let fn = 0;
let fp = 0;
let tn = 0;

const missingByRule = new Map();

for (const sample of positives) {
  const content = `const leaked = "${sample.value}";`;
  const matches = runDetectors(content, cfg).filter((m) => !shouldSkipAsNonSecret(m, content, "src/app.js", cfg.ignoreValueHints));
  const matchedExpected = matches.some((m) => m.rule === sample.rule);
  if (matchedExpected) tp += 1;
  else {
    fn += 1;
    missingByRule.set(sample.rule, (missingByRule.get(sample.rule) || 0) + 1);
  }
}

for (const sample of negatives) {
  const content = `const value = "${sample}";`;
  const matches = runDetectors(content, cfg).filter((m) => !shouldSkipAsNonSecret(m, content, "src/app.js", cfg.ignoreValueHints));
  if (matches.length > 0) fp += 1;
  else tn += 1;
}

const recall = tp / Math.max(1, tp + fn);
const precision = tp / Math.max(1, tp + fp);
const negativePassRate = tn / Math.max(1, tn + fp);

console.log("FixYourSecret Benchmark");
console.log(`- positives: ${positives.length}`);
console.log(`- negatives: ${negatives.length}`);
console.log(`- true positives: ${tp}`);
console.log(`- false negatives: ${fn}`);
console.log(`- false positives: ${fp}`);
console.log(`- true negatives: ${tn}`);
console.log(`- recall: ${recall.toFixed(3)}`);
console.log(`- precision: ${precision.toFixed(3)}`);
console.log(`- negative-pass-rate: ${negativePassRate.toFixed(3)}`);

if (missingByRule.size > 0) {
  console.log("- missing rules:");
  for (const [rule, count] of missingByRule.entries()) {
    console.log(`  - ${rule}: ${count}`);
  }
}

if (recall < minRecall || precision < minPrecision) {
  console.error(`Benchmark gate failed. Required recall>=${minRecall} precision>=${minPrecision}`);
  process.exit(1);
}

console.log("Benchmark gate passed.");

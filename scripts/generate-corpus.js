#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const args = parseArgs(process.argv.slice(2));

const outFile = path.resolve(process.cwd(), args.output || "fixtures/tuning/repos.500.json");
const target = toInt(args.count, 500);
const perPage = 100;
const maxPages = 10;

const query = [
  "stars:>500",
  "archived:false",
  "fork:false",
  "mirror:false",
  "template:false",
  "size:<200000"
].join(" ");

const seen = new Set();
const repos = [
  { name: "fixyoursecret-core", path: "." },
  { name: "demo-app", path: "./demo" }
];
seen.add("fixyoursecret-core");
seen.add("demo-app");

for (let page = 1; page <= maxPages && repos.length < target; page += 1) {
  const data = await fetchSearchPage(query, perPage, page);
  for (const item of data.items || []) {
    const name = String(item.full_name || "").replace("/", "-");
    if (!name || seen.has(name)) continue;
    if (!item.clone_url) continue;

    seen.add(name);
    repos.push({
      name,
      url: item.clone_url,
      stars: item.stargazers_count,
      language: item.language || "unknown"
    });

    if (repos.length >= target) break;
  }
}

if (repos.length < target) {
  throw new Error(`Could not collect target count ${target}. collected=${repos.length}`);
}

await fs.mkdir(path.dirname(outFile), { recursive: true });
await fs.writeFile(outFile, JSON.stringify(repos.slice(0, target), null, 2) + "\n", "utf8");

const byLang = new Map();
for (const repo of repos.slice(2, target)) {
  const lang = repo.language || "unknown";
  byLang.set(lang, (byLang.get(lang) || 0) + 1);
}

console.log(`Generated corpus: ${outFile}`);
console.log(`Total repos: ${Math.min(repos.length, target)}`);
console.log("Language distribution (top 12):");
for (const [lang, count] of [...byLang.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  console.log(`- ${lang}: ${count}`);
}

async function fetchSearchPage(q, per_page, page) {
  const endpoint = `search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${per_page}&page=${page}`;
  const { stdout } = await execFileAsync("gh", ["api", endpoint], { maxBuffer: 20 * 1024 * 1024 });
  return JSON.parse(stdout);
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

function toInt(value, fallback) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

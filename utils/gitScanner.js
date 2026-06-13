import { execFile, spawn } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const UNIT = ""; // field separator for the commit header line
const COMMIT_MARK = "__C__";

// Scans the FULL git history across all branches, including secrets that were
// committed and later deleted (which never appear in the working tree). Each
// unique blob is scanned once and attributed to a commit so users know where
// to rotate.
export async function collectHistoryBlobs(projectPath, options = {}) {
  const allowed = new Set((options.allowedExtensions || []).map((e) => String(e).toLowerCase()));
  const maxBytes = (options.maxFileSizeKB || 256) * 1024;

  let stdout;
  try {
    ({ stdout } = await execFileAsync(
      "git",
      [
        "-c", "core.quotePath=false",
        "log", "--all", "--no-merges", "--no-renames", "--no-abbrev",
        "--diff-filter=AM",
        `--format=${COMMIT_MARK}${UNIT}%H${UNIT}%an${UNIT}%aI`,
        "--raw",
      ],
      { cwd: projectPath, maxBuffer: 256 * 1024 * 1024 }
    ));
  } catch {
    return [];
  }

  const order = [];
  const meta = new Map();
  let current = null;

  for (const line of stdout.split("\n")) {
    if (line.startsWith(COMMIT_MARK)) {
      const [, hash, author, date] = line.split(UNIT);
      current = { hash, author, date };
      continue;
    }
    if (!line.startsWith(":")) continue;
    const tab = line.indexOf("\t");
    if (tab === -1) continue;
    const fields = line.slice(1, tab).trim().split(/\s+/);
    const dstSha = fields[3];
    const filePath = line.slice(tab + 1).trim();
    if (!dstSha || /^0+$/.test(dstSha)) continue;
    if (allowed.size > 0 && !allowed.has(path.extname(filePath).toLowerCase())) continue;
    if (meta.has(dstSha)) continue;
    meta.set(dstSha, { path: filePath, commit: current });
    order.push(dstSha);
  }

  if (order.length === 0) return [];

  const contents = await catFileBatch(projectPath, order);
  const files = [];
  for (const sha of order) {
    const buf = contents.get(sha);
    if (!buf || buf.length === 0 || buf.length > maxBytes) continue;
    const content = buf.toString("utf8");
    if (!content) continue;
    const m = meta.get(sha);
    files.push({
      relativePath: m.path.split(path.sep).join("/"),
      content,
      lines: content.split("\n"),
      commit: m.commit
        ? { hash: m.commit.hash, short: String(m.commit.hash || "").slice(0, 8), author: m.commit.author, date: m.commit.date }
        : null,
    });
  }
  return files;
}

// Streams blob contents from a single `git cat-file --batch` process, which is
// far cheaper than spawning one git process per blob on large histories.
function catFileBatch(projectPath, shas) {
  return new Promise((resolve) => {
    const child = spawn("git", ["cat-file", "--batch"], { cwd: projectPath });
    const contents = new Map();
    let buf = Buffer.alloc(0);
    let expectHeader = true;
    let pending = null;

    child.stdout.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      while (true) {
        if (expectHeader) {
          const nl = buf.indexOf(0x0a);
          if (nl === -1) return;
          const header = buf.slice(0, nl).toString("utf8");
          buf = buf.slice(nl + 1);
          const parts = header.split(" ");
          if (parts[1] === "missing") continue;
          pending = { sha: parts[0], size: Number.parseInt(parts[2], 10) };
          expectHeader = false;
        } else {
          if (buf.length < pending.size + 1) return; // content + trailing LF
          contents.set(pending.sha, buf.slice(0, pending.size));
          buf = buf.slice(pending.size + 1);
          pending = null;
          expectHeader = true;
        }
      }
    });

    child.on("error", () => resolve(contents));
    child.on("close", () => resolve(contents));

    for (const sha of shas) child.stdin.write(sha + "\n");
    child.stdin.end();
  });
}

export async function getStagedFiles(projectPath) {
  return runGitFileList(projectPath, ["diff", "--cached", "--name-only", "--diff-filter=ACMRT"]);
}

export async function getTrackedFiles(projectPath) {
  return runGitFileList(projectPath, ["ls-files"]);
}

export async function getRecentChangedFiles(projectPath, commitCount = 20) {
  const safeCount = Number.isInteger(commitCount) && commitCount > 0 ? commitCount : 20;
  return runGitFileList(projectPath, ["log", `-${safeCount}`, "--name-only", "--pretty=format:"]);
}

async function runGitFileList(projectPath, args) {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd: projectPath });
    return Array.from(new Set(stdout.split("\n").map((line) => line.trim()).filter(Boolean)));
  } catch {
    return [];
  }
}

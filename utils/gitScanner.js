import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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

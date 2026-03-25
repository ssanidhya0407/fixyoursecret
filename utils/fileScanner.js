import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

const DEFAULT_EXTENSIONS = [".js", ".ts", ".jsx", ".tsx", ".env", ".swift"];

export async function collectProjectFiles(projectPath, options = {}) {
  const extensions = Array.isArray(options.allowedExtensions) && options.allowedExtensions.length > 0
    ? options.allowedExtensions
    : DEFAULT_EXTENSIONS;
  const allowedExtensions = new Set(extensions.map((e) => String(e).toLowerCase()));
  const ignore = options.ignorePaths || ["node_modules/**", ".git/**", "dist/**", "build/**"];
  const includeOnly = normalizeSet(options.includeOnly);
  const maxFileSizeBytes = (options.maxFileSizeKB || 256) * 1024;

  const entries = await glob("**/*", {
    cwd: projectPath,
    nodir: true,
    dot: true,
    ignore,
  });

  const files = [];
  for (const relativePath of entries) {
    const normalizedRelative = normalizePath(relativePath);
    if (includeOnly && !includeOnly.has(normalizedRelative)) continue;

    const ext = path.extname(normalizedRelative).toLowerCase();
    if (!allowedExtensions.has(ext)) continue;

    const absolutePath = path.join(projectPath, normalizedRelative);
    let stat;
    try {
      stat = await fs.stat(absolutePath);
    } catch {
      continue;
    }
    if (!stat.isFile() || stat.size > maxFileSizeBytes) continue;

    const content = await fs.readFile(absolutePath, "utf8").catch(() => "");
    if (!content) continue;

    files.push({
      absolutePath,
      relativePath: normalizedRelative,
      content,
      lines: content.split("\n"),
    });
  }

  return files;
}

export function lineColFromIndex(content, index) {
  const start = Math.max(0, index);
  const prefix = content.slice(0, start);
  const lines = prefix.split("\n");
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

function normalizePath(p) {
  return p.split(path.sep).join("/");
}

function normalizeSet(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const normalized = values
    .filter((v) => typeof v === "string")
    .map((v) => v.replace(/^\.\//, ""))
    .map((v) => v.split(path.sep).join("/"));
  return new Set(normalized);
}

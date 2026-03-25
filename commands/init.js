import fs from "node:fs/promises";
import path from "node:path";
import { defaultConfigTemplate } from "../utils/config.js";
import { logger } from "../utils/logger.js";

export async function runInit(options = {}) {
  const projectPath = path.resolve(options.path || process.cwd());
  const configPath = path.join(projectPath, ".secretlintrc.json");
  const baselinePath = path.join(projectPath, ".secretlint-baseline.json");

  await writeIfMissing(configPath, defaultConfigTemplate(), Boolean(options.force));
  await writeIfMissing(baselinePath, "[]\n", Boolean(options.force));

  logger.safe(`Initialized ${configPath}`);
  logger.safe(`Initialized ${baselinePath}`);
  return 0;
}

async function writeIfMissing(filePath, content, force) {
  if (force) {
    await fs.writeFile(filePath, content, "utf8");
    return;
  }

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, content, "utf8");
  }
}

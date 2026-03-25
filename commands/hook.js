import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "../utils/logger.js";

export async function runHookInstall(options = {}) {
  const projectPath = path.resolve(options.path || process.cwd());
  const hookPath = path.join(projectPath, ".git", "hooks", "pre-commit");

  const script = `#!/usr/bin/env sh
# Secretlint pre-commit hook
secretlint scan --staged --fail-on high
status=$?
if [ "$status" -ne 0 ]; then
  echo "[secretlint] commit blocked due to high-risk findings"
  exit $status
fi
`;

  try {
    await fs.mkdir(path.dirname(hookPath), { recursive: true });
    await fs.writeFile(hookPath, script, { encoding: "utf8", mode: 0o755 });
    logger.safe(`Installed pre-commit hook at ${hookPath}`);
    return 0;
  } catch (error) {
    logger.error(`Failed to install hook: ${error.message}`);
    return 1;
  }
}

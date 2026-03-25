import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runHookInstall } from "../commands/hook.js";

async function mkRepo() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "secretlint-hook-"));
  await fs.mkdir(path.join(dir, ".git", "hooks"), { recursive: true });
  return dir;
}

test("hook install writes pre-commit file", async () => {
  const project = await mkRepo();
  const code = await runHookInstall({ path: project });
  const hookPath = path.join(project, ".git", "hooks", "pre-commit");
  const content = await fs.readFile(hookPath, "utf8");

  assert.equal(code, 0);
  assert.match(content, /secretlint scan --staged --fail-on high/);
});

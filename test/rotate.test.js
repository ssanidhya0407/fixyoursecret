import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runRotate } from "../commands/rotate.js";

async function mkProject() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "secretlint-rotate-"));
  return dir;
}

test("rotate dry run does not write file", async () => {
  const project = await mkProject();
  const envPath = path.join(project, ".env");
  await fs.writeFile(envPath, "OPENAI_API_KEY=old\n", "utf8");
  const fakeKey = "sk-proj-" + "abcdefghijklmnopqrstuvwxyz123456";

  const code = await runRotate("openai", {
    path: project,
    dryRun: true,
    key: fakeKey,
  });

  const env = await fs.readFile(envPath, "utf8");
  assert.equal(code, 0);
  assert.equal(env, "OPENAI_API_KEY=old\n");
});

test("rotate writes new key", async () => {
  const project = await mkProject();
  const envPath = path.join(project, ".env");
  await fs.writeFile(envPath, "OPENAI_API_KEY=old\n", "utf8");
  const fakeKey = "sk-proj-" + "abcdefghijklmnopqrstuvwxyz123456";

  const code = await runRotate("openai", {
    path: project,
    key: fakeKey,
  });

  const env = await fs.readFile(envPath, "utf8");
  assert.equal(code, 0);
  assert.ok(env.includes(`OPENAI_API_KEY=${fakeKey}`));
});

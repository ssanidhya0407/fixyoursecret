import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

test("benchmark script passes default quality gate", async () => {
  const cwd = path.resolve(process.cwd());
  const { stdout } = await execFileAsync("node", ["scripts/benchmark.js"], { cwd });
  assert.match(stdout, /Benchmark gate passed/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { runScan } from "../commands/scan.js";

const execFileAsync = promisify(execFile);

async function mkProject() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "fixyoursecret-scan-"));
  return dir;
}

test("runScan finds OpenAI key in frontend file", async () => {
  const project = await mkProject();
  const fakeKey = "sk-proj-" + "abcdefghijklmnopqrstuvwxyz123456";
  await fs.mkdir(path.join(project, "src"), { recursive: true });
  await fs.writeFile(
    path.join(project, "src", "App.js"),
    `const key = "${fakeKey}";\n`,
    "utf8"
  );

  const output = path.join(project, "out.json");
  const code = await runScan({ path: project, format: "json", outputFile: output, noBaseline: true });
  const findings = JSON.parse(await fs.readFile(output, "utf8"));

  assert.equal(code, 1);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "openai-key");
  assert.equal(findings[0].severity, "HIGH");
});

test("runScan detects newly added AWS detector", async () => {
  const project = await mkProject();
  await fs.mkdir(path.join(project, "server"), { recursive: true });
  await fs.writeFile(path.join(project, "server", "config.js"), 'const key = "AKIAABCDEFGHIJKLMNOP";\n', "utf8");

  const output = path.join(project, "aws-findings.json");
  const code = await runScan({ path: project, format: "json", outputFile: output, noBaseline: true });
  const findings = JSON.parse(await fs.readFile(output, "utf8"));

  assert.equal(code, 1);
  assert.equal(findings[0].rule, "aws-access-key-id");
});

test("verify strict removes non-verified matches", async () => {
  const project = await mkProject();
  await fs.mkdir(path.join(project, "src"), { recursive: true });
  await fs.writeFile(
    path.join(project, "src", "App.js"),
    'const key = "sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaa";\n',
    "utf8"
  );

  const output = path.join(project, "strict.json");
  const code = await runScan({
    path: project,
    format: "json",
    outputFile: output,
    noBaseline: true,
    verify: "safe",
    verifyStrict: true,
  });
  const findings = JSON.parse(await fs.readFile(output, "utf8"));

  assert.equal(code, 0);
  assert.equal(findings.length, 0);
});

test("runScan respects baseline filtering", async () => {
  const project = await mkProject();
  const fakeKey = "sk-proj-" + "abcdefghijklmnopqrstuvwxyz123456";
  await fs.mkdir(path.join(project, "src"), { recursive: true });
  await fs.writeFile(
    path.join(project, "src", "App.js"),
    `const key = "${fakeKey}";\n`,
    "utf8"
  );

  await runScan({ path: project, updateBaseline: true, noBaseline: true, format: "json" });
  const output = path.join(project, "out2.json");
  const code = await runScan({ path: project, format: "json", outputFile: output });
  const findings = JSON.parse(await fs.readFile(output, "utf8"));

  assert.equal(code, 0);
  assert.equal(findings.length, 0);
});

test("history mode scans files from recent commits", async () => {
  const project = await mkProject();
  await execFileAsync("git", ["init"], { cwd: project });
  await execFileAsync("git", ["config", "user.email", "bot@example.com"], { cwd: project });
  await execFileAsync("git", ["config", "user.name", "bot"], { cwd: project });

  await fs.mkdir(path.join(project, "src"), { recursive: true });
  await fs.writeFile(path.join(project, "src", "safe.js"), "console.log('ok')\n", "utf8");
  await execFileAsync("git", ["add", "."], { cwd: project });
  await execFileAsync("git", ["commit", "-m", "init"], { cwd: project });

  const fakeSlackToken = ["xox", "b-1234567890-abcdefghijklmnop"].join("");
  await fs.writeFile(path.join(project, "src", "safe.js"), `const token = "${fakeSlackToken}";\n`, "utf8");
  await execFileAsync("git", ["add", "."], { cwd: project });
  await execFileAsync("git", ["commit", "-m", "introduce leak"], { cwd: project });

  const output = path.join(project, "history.json");
  const code = await runScan({ path: project, history: 1, format: "json", outputFile: output, noBaseline: true });
  const findings = JSON.parse(await fs.readFile(output, "utf8"));

  assert.equal(code, 1);
  assert.ok(findings.some((f) => f.rule === "slack-token"));
});

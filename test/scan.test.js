import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runScan } from "../commands/scan.js";

async function mkProject() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "secretlint-scan-"));
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

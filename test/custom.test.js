import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runScan } from "../commands/scan.js";

async function mkProject() {
  return fs.mkdtemp(path.join(os.tmpdir(), "fixyoursecret-custom-"));
}

async function writeConfig(project, customRules) {
  await fs.writeFile(
    path.join(project, ".fixyoursecretrc.json"),
    JSON.stringify({ customRules }, null, 2),
    "utf8"
  );
}

async function scanJson(project, opts = {}) {
  const output = path.join(project, "out.json");
  const code = await runScan({ path: project, format: "json", outputFile: output, noBaseline: true, ...opts });
  const findings = JSON.parse(await fs.readFile(output, "utf8"));
  return { code, findings };
}

test("custom rule detects a project-specific token", async () => {
  const project = await mkProject();
  await fs.mkdir(path.join(project, "server"), { recursive: true });
  await fs.writeFile(
    path.join(project, "server", "client.js"),
    'const t = "acme_0123456789abcdef0123456789abcdef";\n',
    "utf8"
  );
  await writeConfig(project, [
    { id: "acme-token", regex: "acme_[a-f0-9]{32}", severity: "medium", issue: "Acme internal token exposed" },
  ]);

  const { code, findings } = await scanJson(project, { failOn: "medium" });
  const hit = findings.find((f) => f.rule === "acme-token");
  assert.ok(hit, "expected the custom acme-token rule to fire");
  assert.equal(hit.severity, "MEDIUM");
  assert.equal(hit.issue, "Acme internal token exposed");
  assert.equal(code, 1);
});

test("custom rule severity escalates to HIGH in frontend context", async () => {
  const project = await mkProject();
  await fs.mkdir(path.join(project, "src"), { recursive: true });
  await fs.writeFile(
    path.join(project, "src", "App.js"),
    'const t = "acme_0123456789abcdef0123456789abcdef";\n',
    "utf8"
  );
  await writeConfig(project, [{ id: "acme-token", regex: "acme_[a-f0-9]{32}", severity: "medium" }]);

  const { findings } = await scanJson(project);
  const hit = findings.find((f) => f.rule === "acme-token");
  assert.ok(hit);
  assert.equal(hit.severity, "HIGH", "frontend exposure should escalate a medium custom rule to HIGH");
});

test("a capture group is reported as the secret value", async () => {
  const project = await mkProject();
  await fs.mkdir(path.join(project, "server"), { recursive: true });
  await fs.writeFile(
    path.join(project, "server", "c.js"),
    'Authorization: Token secret_ABCDEFGHIJKLMNOP\n',
    "utf8"
  );
  await writeConfig(project, [{ id: "bearer", regex: "Token (secret_[A-Z]{16})", severity: "high" }]);

  const { findings } = await scanJson(project);
  const hit = findings.find((f) => f.rule === "bearer");
  assert.ok(hit);
  assert.equal(hit.snippet.includes("secret_ABCDEFGHIJKLMNOP"), true);
});

test("invalid regex rules are skipped without crashing, valid ones still run", async () => {
  const project = await mkProject();
  await fs.mkdir(path.join(project, "server"), { recursive: true });
  await fs.writeFile(
    path.join(project, "server", "c.js"),
    'const t = "acme_0123456789abcdef0123456789abcdef";\n',
    "utf8"
  );
  await writeConfig(project, [
    { id: "broken", regex: "acme_([a-f0-9", severity: "high" }, // unbalanced group -> dropped
    { id: "acme-token", regex: "acme_[a-f0-9]{32}", severity: "high" },
  ]);

  const { findings } = await scanJson(project);
  assert.ok(findings.some((f) => f.rule === "acme-token"));
  assert.ok(!findings.some((f) => f.rule === "broken"));
});

test("custom findings survive --verify safe --verify-strict", async () => {
  const project = await mkProject();
  await fs.mkdir(path.join(project, "server"), { recursive: true });
  await fs.writeFile(
    path.join(project, "server", "c.js"),
    'const t = "acme_0123456789abcdef0123456789abcdef";\n',
    "utf8"
  );
  await writeConfig(project, [{ id: "acme-token", regex: "acme_[a-f0-9]{32}", severity: "high" }]);

  const { findings } = await scanJson(project, { verify: "safe", verifyStrict: true });
  const hit = findings.find((f) => f.rule === "acme-token");
  assert.ok(hit, "custom rule should not be dropped by strict verification");
  assert.equal(hit.verified, true);
});

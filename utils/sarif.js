import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TOOL_VERSION = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8")
).version;

export function findingsToSarif(findings, toolName = "fixyoursecret") {
  const rulesMap = new Map();

  for (const finding of findings) {
    const id = finding.rule || "unknown-rule";
    if (!rulesMap.has(id)) {
      rulesMap.set(id, {
        id,
        shortDescription: { text: finding.issue },
        fullDescription: { text: finding.recommendation || finding.issue },
        defaultConfiguration: {
          level: sarifLevel(finding.severity),
        },
      });
    }
  }

  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: toolName,
            version: TOOL_VERSION,
            rules: Array.from(rulesMap.values()),
          },
        },
        results: findings.map((finding) => ({
          ruleId: finding.rule || "unknown-rule",
          level: sarifLevel(finding.severity),
          message: { text: `${finding.issue}. ${finding.recommendation || ""}`.trim() },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: finding.file },
                region: {
                  startLine: finding.line,
                  startColumn: finding.column,
                },
              },
            },
          ],
        })),
      },
    ],
  };
}

function sarifLevel(severity) {
  if (severity === "HIGH") return "error";
  if (severity === "MEDIUM") return "warning";
  return "note";
}

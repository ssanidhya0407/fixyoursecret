export function findingsToSarif(findings, toolName = "secretlint") {
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
            version: "0.2.1-developer-preview.1",
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

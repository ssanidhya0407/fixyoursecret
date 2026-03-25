import fs from "node:fs/promises";
import path from "node:path";
import { collectProjectFiles } from "../utils/fileScanner.js";
import { logger } from "../utils/logger.js";
import { expressProxyTemplate } from "../templates/expressProxy.js";

const EXPOSED_OPENAI_CALL_REGEX =
  /fetch\s*\(\s*["'`]https:\/\/api\.openai\.com\/[\s\S]{0,500}?["'`]?Authorization["'`]?\s*:\s*["'`]Bearer\s+sk-[A-Za-z0-9_-]{20,}["'`]/;

export async function runFix(options = {}) {
  const projectPath = path.resolve(options.path || process.cwd());
  const outputDir = path.resolve(options.output || "fixyoursecret-output");

  const files = await collectProjectFiles(projectPath);
  const riskyFiles = [];

  for (const file of files) {
    if (!/\.(js|jsx|ts|tsx)$/i.test(file.relativePath)) continue;
    if (EXPOSED_OPENAI_CALL_REGEX.test(file.content)) {
      riskyFiles.push(file.relativePath);
    }
  }

  await fs.mkdir(outputDir, { recursive: true });

  const backendPath = path.join(outputDir, "backend.js");
  const patchPath = path.join(outputDir, "frontend.patch.js");

  await fs.writeFile(backendPath, expressProxyTemplate(), "utf8");
  await fs.writeFile(patchPath, buildFrontendPatch(riskyFiles), "utf8");

  logger.safe(`Generated: ${backendPath}`);
  logger.safe(`Generated: ${patchPath}`);

  if (riskyFiles.length > 0) {
    logger.warn("Detected exposed API call patterns in:");
    for (const file of riskyFiles) {
      logger.log(`  - ${file}`);
    }
  } else {
    logger.warn("No explicit OpenAI fetch patterns found, templates generated as preventive defaults.");
  }

  logger.log("\nNext steps:");
  logger.log("1. Run backend proxy server (backend.js)");
  logger.log("2. Replace direct frontend provider calls with callAIProxy(...)");
  logger.log("3. Move API key to OPENAI_API_KEY in backend environment");

  return 0;
}

function buildFrontendPatch(riskyFiles) {
  const fileList = riskyFiles.length > 0 ? riskyFiles.map((f) => `// - ${f}`).join("\n") : "// No risky files auto-detected";

  return `/**
 * fixyoursecret generated frontend patch helper.
 * Replace direct provider calls with this internal API call.
 *\n${fileList}
 */

export async function callAIProxy(messages) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(
      "Proxy request failed: " + err
    );
  }

  return response.json();
}

/*
Example replacement:

Before:
fetch("https://api.openai.com/v1/chat/completions", { ... Authorization: "Bearer sk-..." ... })

After:
const data = await callAIProxy(messages)
*/
`;
}

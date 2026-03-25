import fs from "node:fs/promises";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { logger } from "../utils/logger.js";

const providerConfig = {
  openai: {
    keyName: "OPENAI_API_KEY",
    url: "https://platform.openai.com/api-keys",
    validator: /^sk-(?:proj-)?[A-Za-z0-9_-]{20,}$/,
  },
  google: {
    keyName: "GOOGLE_API_KEY",
    url: "https://console.cloud.google.com/apis/credentials",
    validator: /^AIza[A-Za-z0-9_-]{35}$/,
  },
};

export async function runRotate(provider, options = {}) {
  const normalized = String(provider || "").toLowerCase();
  const cfg = providerConfig[normalized];

  if (!cfg) {
    logger.error(`Unsupported provider: ${provider}. Supported: ${Object.keys(providerConfig).join(", ")}`);
    return 1;
  }

  logger.log(`[1] Open: ${cfg.url}`);
  logger.log("[2] Create a new key with least privilege");
  logger.log("[3] Rotate without committing plaintext keys\n");

  const newKey = await resolveKeyInput(cfg.keyName, options);
  if (!cfg.validator.test(newKey)) {
    logger.error("Key format looks invalid. Aborting .env update.");
    return 1;
  }

  const projectPath = path.resolve(options.path || process.cwd());
  const envPath = options.envFile ? path.resolve(options.envFile) : path.join(projectPath, ".env");

  let envContent = "";
  try {
    envContent = await fs.readFile(envPath, "utf8");
  } catch {
    envContent = "";
  }

  const updated = upsertEnv(envContent, cfg.keyName, newKey);

  if (options.dryRun) {
    logger.warn("Dry run enabled: no file was modified.");
    logger.log(`Would update ${envPath} with ${cfg.keyName}`);
    return 0;
  }

  const backupPath = `${envPath}.bak.${Date.now()}`;
  try {
    if (envContent) {
      await fs.writeFile(backupPath, envContent, "utf8");
      logger.log(`Backup created: ${backupPath}`);
    }

    await fs.writeFile(envPath, updated, "utf8");
  } catch (error) {
    if (envContent) {
      try {
        await fs.writeFile(envPath, envContent, "utf8");
      } catch {
        logger.error("Rollback failed. Please restore from backup manually.");
      }
    }
    logger.error(`Failed to update env file: ${error.message}`);
    return 1;
  }

  logger.safe(`Updated ${envPath} with ${cfg.keyName}`);
  logger.warn("Restart backend workers and redeploy to activate the new key.");
  logger.log("Run `fixyoursecret scan` (or `secretlint scan`) to verify no hardcoded keys remain.");
  return 0;
}

async function resolveKeyInput(keyName, options) {
  if (options.key) return String(options.key).trim();

  if (!input.isTTY) {
    const chunks = [];
    for await (const chunk of input) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf8").trim();
  }

  return readHiddenInput(`New ${keyName}: `);
}

async function readHiddenInput(promptText) {
  output.write(promptText);

  input.setRawMode(true);
  input.resume();
  input.setEncoding("utf8");

  return await new Promise((resolve) => {
    let value = "";

    function onData(char) {
      if (char === "\r" || char === "\n") {
        output.write("\n");
        cleanup();
        resolve(value.trim());
        return;
      }
      if (char === "\u0003") {
        cleanup();
        process.exit(130);
      }
      if (char === "\u007f") {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    }

    function cleanup() {
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
    }

    input.on("data", onData);
  });
}

function upsertEnv(envContent, key, value) {
  const lineRegex = new RegExp(`^${escapeRegExp(key)}=.*$`, "m");
  const entry = `${key}=${value}`;

  if (lineRegex.test(envContent)) {
    return envContent.replace(lineRegex, entry);
  }

  if (envContent.length === 0) return `${entry}\n`;
  return envContent.endsWith("\n") ? envContent + `${entry}\n` : `${envContent}\n${entry}\n`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

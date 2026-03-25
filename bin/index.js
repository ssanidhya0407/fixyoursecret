#!/usr/bin/env node
import { Command } from "commander";
import { runScan } from "../commands/scan.js";
import { runFix } from "../commands/fix.js";
import { runRotate } from "../commands/rotate.js";
import { runInit } from "../commands/init.js";
import { runHookInstall } from "../commands/hook.js";

const program = new Command();

program
  .name("secretlint")
  .description("ESLint-style CLI for finding leaked secrets and preventing key exposure")
  .version("0.2.0");

program
  .command("init")
  .description("Initialize .secretlintrc.json and baseline file")
  .option("-p, --path <path>", "project path", process.cwd())
  .option("--force", "overwrite existing files", false)
  .action(async (options) => {
    process.exitCode = await runInit(options);
  });

program
  .command("scan")
  .description("Scan project files for leaked API keys and exposure risks")
  .option("-p, --path <path>", "project path to scan", process.cwd())
  .option("--json", "output findings as JSON", false)
  .option("--format <format>", "output format: text|json|sarif", "text")
  .option("--output-file <path>", "write JSON/SARIF output to file")
  .option("--fail-on <severity>", "low|medium|high", "high")
  .option("--config <path>", "custom config file path")
  .option("--staged", "scan only staged git files", false)
  .option("--tracked", "scan tracked git files", false)
  .option("--history <n>", "scan files touched in last n commits")
  .option("--baseline <path>", "baseline file path", ".secretlint-baseline.json")
  .option("--update-baseline", "replace baseline with current findings", false)
  .option("--no-baseline", "ignore baseline filtering")
  .action(async (options) => {
    process.exitCode = await runScan(options);
  });

program
  .command("fix")
  .description("Generate backend proxy + frontend patch template for exposed API calls")
  .option("-p, --path <path>", "project path to inspect", process.cwd())
  .option("-o, --output <path>", "output folder", "secretlint-output")
  .action(async (options) => {
    process.exitCode = await runFix(options);
  });

program
  .command("ci")
  .description("CI-focused scan (SARIF output + fail on medium by default)")
  .option("-p, --path <path>", "project path to scan", process.cwd())
  .option("--output-file <path>", "sarif output path", "secretlint.sarif")
  .option("--fail-on <severity>", "low|medium|high", "medium")
  .option("--config <path>", "custom config file path")
  .action(async (options) => {
    process.exitCode = await runScan({
      path: options.path,
      format: "sarif",
      outputFile: options.outputFile,
      failOn: options.failOn,
      config: options.config,
      tracked: true,
    });
  });

program
  .command("rotate")
  .description("Rotate API keys safely and update .env")
  .argument("<provider>", "provider name e.g. openai")
  .option("-p, --path <path>", "project path", process.cwd())
  .option("--env-file <path>", "explicit .env file path")
  .option("--dry-run", "validate and preview without writing files", false)
  .option("--key <value>", "non-interactive key value (use with caution)")
  .action(async (provider, options) => {
    process.exitCode = await runRotate(provider, options);
  });

const hook = program.command("hook").description("Manage git hooks");
hook
  .command("install")
  .description("Install a pre-commit hook to block high-risk secrets")
  .option("-p, --path <path>", "project path", process.cwd())
  .action(async (options) => {
    process.exitCode = await runHookInstall(options);
  });

program.parseAsync(process.argv);

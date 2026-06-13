import chalk from "chalk";

export const logger = {
  log: (...args) => console.log(...args),
  warn: (...args) => console.log(chalk.yellow(...args)),
  error: (...args) => console.error(chalk.red(...args)),
  safe: (...args) => console.log(chalk.green(...args)),
};

export function printFinding(f) {
  const label = f.severity === "HIGH" ? chalk.red("[HIGH]") : f.severity === "MEDIUM" ? chalk.yellow("[WARNING]") : chalk.blue("[LOW]");

  console.log(label);
  console.log(`File: ${f.file}:${f.line}:${f.column}`);
  if (f.commit) {
    const who = f.commit.author ? ` by ${f.commit.author}` : "";
    const when = f.commit.date ? ` on ${f.commit.date}` : "";
    console.log(`Commit: ${f.commit.short || f.commit.hash}${who}${when}`);
  }
  console.log(`Issue: ${f.issue}`);
  if (f.rule) console.log(`Rule: ${f.rule}`);
  console.log(`Risk: ${f.severity}`);
  console.log(`Snippet: ${chalk.gray(f.snippet)}`);
  if (f.reason) console.log(`Reason: ${f.reason}`);
  console.log(`Fix: ${f.recommendation}`);
  console.log("");
}

export function printSummary(findings) {
  const high = findings.filter((f) => f.severity === "HIGH").length;
  const medium = findings.filter((f) => f.severity === "MEDIUM").length;
  const low = findings.filter((f) => f.severity === "LOW").length;
  const total = findings.length;
  const color = high > 0 ? chalk.red : medium > 0 ? chalk.yellow : chalk.green;

  console.log(color(`${total} issues found (${high} high risk, ${medium} medium, ${low} low)`));
}

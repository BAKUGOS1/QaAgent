import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

interface GateResult {
  name: string;
  status: "PASS" | "FAIL";
  details: string;
}

const results: GateResult[] = [];

function run(name: string, command: string, args: string[]): void {
  const isWindows = process.platform === "win32";
  const result = spawnSync(
    isWindows ? "cmd.exe" : command,
    isWindows ? ["/d", "/s", "/c", [command, ...args].join(" ")] : args,
    {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "pipe",
      env: { ...process.env, QA_GATE_CHILD: "1" }
    }
  );
  const output = [result.stdout, result.stderr, result.error?.message].filter(Boolean).join("\n").trim();
  results.push({
    name,
    status: !result.error && result.status === 0 ? "PASS" : "FAIL",
    details: output.split("\n").slice(-12).join("\n")
  });
}

function secretScan(): void {
  const roots = [
    "agent/src",
    "agent/scripts",
    "agent/tests",
    "agent/tasks",
    "agent/memory",
    ".codex",
    ".agents",
    "plugins",
    "docs",
    "README.md",
    "AGENTS.md",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "package.json",
    "package-lock.json",
    ".env.example"
  ];
  const files = roots.flatMap((root) => listFiles(root)).filter((file) => !isIgnored(file));
  const patterns = [
    { name: "Groq API key", pattern: /gsk_[A-Za-z0-9_-]{20,}/ },
    { name: "OpenAI API key", pattern: /sk-[A-Za-z0-9_-]{20,}/ },
    { name: "JWT token", pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/ },
    { name: "Hardcoded password", pattern: /(password|passwd|pwd)\s*[:=]\s*["'][^"']{4,}["']/i }
  ];
  const findings: string[] = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split("\n");
    for (const item of patterns) {
      lines.forEach((line, index) => {
        if (item.pattern.test(line) && !allowedSecretExample(file, line) && !allowedSelectorOrEnvReference(line)) {
          findings.push(`${item.name}: ${file}:${index + 1}`);
        }
      });
    }
  }
  results.push({
    name: "secret-scan",
    status: findings.length ? "FAIL" : "PASS",
    details: findings.length ? findings.join("\n") : "No hardcoded secrets found in scanned project files."
  });
}

function reportSanity(): void {
  const reportDir = path.join(process.cwd(), "agent", "reports");
  if (!fs.existsSync(reportDir)) {
    results.push({ name: "report-sanity", status: "PASS", details: "No report directory yet." });
    return;
  }
  const latestExcel = fs.readdirSync(reportDir)
    .filter((file) => file.endsWith(".xlsx"))
    .map((file) => path.join(reportDir, file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  if (!latestExcel) {
    results.push({ name: "report-sanity", status: "PASS", details: "No Excel reports yet." });
    return;
  }
  const bytes = fs.readFileSync(latestExcel);
  const hasWorkbook = bytes.includes(Buffer.from("xl/workbook.xml"));
  results.push({
    name: "report-sanity",
    status: hasWorkbook ? "PASS" : "FAIL",
    details: hasWorkbook ? `Latest Excel report is structurally present: ${latestExcel}` : `Latest Excel report looks invalid: ${latestExcel}`
  });
}

function listFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const stat = fs.statSync(root);
  if (stat.isFile()) return [root];
  return fs.readdirSync(root).flatMap((entry) => listFiles(path.join(root, entry)));
}

function isIgnored(file: string): boolean {
  return file.includes("node_modules") ||
    file.includes("agent/reports") ||
    file.includes("agent/artifacts") ||
    file.endsWith(".png") ||
    file.endsWith(".xlsx") ||
    file.endsWith(".json") && file.includes("package-lock");
}

function allowedSecretExample(file: string, text: string): boolean {
  return file.endsWith(".env.example") && /GROQ_API_KEY=$/.test(text);
}

function allowedSelectorOrEnvReference(line: string): boolean {
  const normalized = line.toLowerCase();
  return normalized.includes("process.env") ||
    normalized.includes("input[name='password']") ||
    normalized.includes('input[name="password"]') ||
    normalized.includes("passwordselector") ||
    normalized.includes("loginpassword");
}

run("typecheck", "npm", ["run", "typecheck"]);
run("smoke", "npm", ["run", "test:smoke"]);
run("npm-audit-high", "npm", ["audit", "--audit-level=high"]);
secretScan();
reportSanity();

console.log("\nQA Agent Quality Gate");
for (const result of results) {
  console.log(`\n[${result.status}] ${result.name}`);
  if (result.details) console.log(result.details);
}

if (results.some((result) => result.status === "FAIL")) {
  process.exitCode = 1;
}

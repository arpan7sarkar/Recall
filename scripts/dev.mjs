import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const processes = [
  { name: "web", cwd: "apps/web", script: "dev" },
  { name: "api", cwd: "apps/api", script: "dev" },
  { name: "worker", cwd: "apps/api", script: "worker" },
];

const children = [];
const aliveChildren = new Set();
let shuttingDown = false;
let shutdownExitCode = 0;

function stopAll(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  shutdownExitCode = exitCode;

  for (const child of aliveChildren) {
    if (!child.killed) child.kill("SIGTERM");
  }

  const forceExit = setTimeout(() => process.exit(exitCode), 10_000);
  forceExit.unref();
  if (aliveChildren.size === 0) process.exit(exitCode);
}

for (const processSpec of processes) {
  const child = spawn(npmCommand, ["run", processSpec.script], {
    cwd: resolve(root, processSpec.cwd),
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });
  children.push(child);
  aliveChildren.add(child);

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${processSpec.name}] ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${processSpec.name}] ${chunk}`);
  });
  child.on("error", (error) => {
    console.error(`[${processSpec.name}] failed to start: ${error.message}`);
    stopAll(1);
  });
  child.on("exit", (code, signal) => {
    aliveChildren.delete(child);
    if (shuttingDown && aliveChildren.size === 0) process.exit(shutdownExitCode);
    if (!shuttingDown && code !== 0) {
      console.error(`[${processSpec.name}] exited with ${signal ?? `code ${code}`}`);
      stopAll(code ?? 1);
    }
  });
}

process.once("SIGINT", () => stopAll(0));
process.once("SIGTERM", () => stopAll(0));

console.log("Recall development runtime started: web, api, and worker");
console.log("Use Ctrl-C to stop all processes");

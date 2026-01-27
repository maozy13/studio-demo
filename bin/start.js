#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Resolve project root so Vite starts from the correct directory.
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

// Use npm to run the dev script so local Vite is used.
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

// Spawn Vite with stdio inherited for interactive logs.
const devProcess = spawn(npmCommand, ["run", "dev"], {
  cwd: projectRoot,
  stdio: "inherit",
});

// Ensure the CLI exits with the same code as the Vite process.
devProcess.on("exit", (code) => {
  if (typeof code === "number") {
    process.exit(code);
  }
});

// Surface spawn errors clearly.
devProcess.on("error", (error) => {
  console.error("Failed to start Vite:", error);
  process.exit(1);
});

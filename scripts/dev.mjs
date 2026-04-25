import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";

const children = [];

function startProcess(label, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.log(`[${label}] exited with ${reason}`);

    if (!shuttingDown) {
      shuttingDown = true;
      for (const current of children) {
        if (current !== child && !current.killed) {
          current.kill("SIGTERM");
        }
      }
      process.exit(code ?? 0);
    }
  });

  children.push(child);
  return child;
}

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Stopping dev servers (${signal})...`);

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function isPortInUse(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function main() {
  console.log("Starting frontend and backend dev servers...");

  const backendAlreadyRunning = await isPortInUse(5000);

  if (backendAlreadyRunning) {
    console.log("[backend] Detected an existing service on port 5000, skipping backend startup.");
  } else {
    startProcess(
      "backend",
      process.execPath,
      ["--env-file=server/.env", "server/index.js"],
      process.cwd(),
    );
  }

  startProcess(
    "frontend",
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--configLoader", "runner"],
    process.cwd(),
  );
}

void main();

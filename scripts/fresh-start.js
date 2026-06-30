#!/usr/bin/env node
/**
 * fresh-start: recover a wedged Expo dev environment in one command.
 *
 * Steps, in order:
 *   1. Kill ghost Metro/Expo/node processes still holding the dev ports.
 *   2. Purge the Watchman watch + recrawl state.
 *   3. Delete the NativeWind / Expo / Metro caches.
 *   4. Boot a fresh server with `expo start -c` (clears the bundler cache too).
 *
 * Cross-platform (Windows + macOS/Linux). Each cleanup step is best-effort:
 * a missing tool (e.g. watchman not installed) is logged and skipped, never fatal.
 */
const { execSync, spawnSync, spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const isWin = process.platform === "win32";
const root = path.resolve(__dirname, "..");
const DEV_PORTS = [8081, 19000, 19001, 19002];

const log = (msg) => console.log(`\x1b[36m[fresh]\x1b[0m ${msg}`);
const warn = (msg) => console.log(`\x1b[33m[fresh]\x1b[0m ${msg}`);

function tryRun(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "ignore", shell: isWin });
  return r.status === 0;
}

function hasCmd(cmd) {
  const probe = isWin ? "where" : "which";
  return spawnSync(probe, [cmd], { stdio: "ignore", shell: isWin }).status === 0;
}

// 1. Kill ghost processes occupying the Metro/Expo dev ports (never this process).
function killGhosts() {
  log("Killing ghost Metro/Expo processes on dev ports...");
  for (const port of DEV_PORTS) {
    const pids = new Set();
    try {
      if (isWin) {
        const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
        for (const line of out.trim().split(/\r?\n/)) {
          const pid = line.trim().split(/\s+/).pop();
          if (/^\d+$/.test(pid)) pids.add(pid);
        }
      } else {
        const out = execSync(`lsof -ti:${port}`, { encoding: "utf8" });
        for (const pid of out.trim().split(/\r?\n/)) if (/^\d+$/.test(pid)) pids.add(pid);
      }
    } catch {
      // nothing listening on this port
    }
    for (const pid of pids) {
      if (pid === String(process.pid)) continue;
      const killed = isWin ? tryRun("taskkill", ["/F", "/PID", pid]) : tryRun("kill", ["-9", pid]);
      if (killed) log(`  killed PID ${pid} on :${port}`);
    }
  }
}

// 2. Purge Watchman so it re-crawls from scratch (cures stale "changes revert" state).
function purgeWatchman() {
  if (!hasCmd("watchman")) {
    warn("watchman not installed — skipping purge");
    return;
  }
  log("Purging Watchman watches...");
  tryRun("watchman", ["watch-del-all"]);
  tryRun("watchman", ["shutdown-server"]);
}

// 3. Delete NativeWind / Expo / Metro caches.
function clearCaches() {
  log("Clearing NativeWind / Expo / Metro caches...");
  const targets = [
    path.join(root, ".expo"),
    path.join(root, "node_modules", ".cache"), // nativewind + metro transform cache
  ];
  for (const t of targets) {
    try {
      fs.rmSync(t, { recursive: true, force: true });
      log(`  removed ${path.relative(root, t)}`);
    } catch (e) {
      warn(`  could not remove ${t}: ${e.message}`);
    }
  }
  // Metro/Haste scratch caches in the OS temp dir.
  try {
    const tmp = os.tmpdir();
    for (const name of fs.readdirSync(tmp)) {
      if (/^(metro-|haste-map-|react-native-)/.test(name)) {
        fs.rmSync(path.join(tmp, name), { recursive: true, force: true });
        log(`  removed temp/${name}`);
      }
    }
  } catch {
    // temp dir not readable — non-fatal
  }
}

// 4. Boot a clean server. `-c` clears the Metro bundler cache on start.
function bootServer() {
  log("Booting fresh Expo server (expo start -c)...");
  const child = spawn("npx", ["expo", "start", "-c"], {
    cwd: root,
    stdio: "inherit",
    shell: isWin,
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

killGhosts();
purgeWatchman();
clearCaches();
bootServer();

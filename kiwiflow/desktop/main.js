// KiwiFlow desktop shell.
//
// This does NOT reimplement KiwiFlow — it runs the real, unmodified Next.js
// standalone build (bundled under resources/app-standalone by build.js) as a
// child process, using Electron's own embedded Node runtime
// (ELECTRON_RUN_AS_NODE=1, the standard way to run a plain Node script
// without shipping a second Node.js binary alongside Electron), and points
// it at a SQLite database file that lives in this Windows user's own
// per-app data folder. Nothing here talks to kiwiflow.hatchable.site or any
// other install — this is a separate, fully offline copy with its own data.
const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const net = require("node:net");
const http = require("node:http");
const { fork } = require("node:child_process");
const crypto = require("node:crypto");

const isPackaged = app.isPackaged;
const resourcesDir = isPackaged ? process.resourcesPath : path.join(__dirname, "resources");
const standaloneDir = path.join(resourcesDir, "app-standalone");
const migrationsDir = path.join(resourcesDir, "migrations");
const globalRulesPath = path.join(resourcesDir, "globalWorkflowRules.json");

const userDataDir = app.getPath("userData");
const dbPath = path.join(userDataDir, "kiwiflow.db");
const configPath = path.join(userDataDir, "config.json");

let serverProcess = null;
let mainWindow = null;

function loadOrCreateConfig() {
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
  // AUTH_SECRET signs this install's session cookies — generated once,
  // persisted, and never sent anywhere. Losing it just logs everyone out.
  const config = { authSecret: crypto.randomBytes(48).toString("hex") };
  fs.mkdirSync(userDataDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return config;
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

/** First-run only: builds the SQLite schema from the app's real migration
 * files and seeds the global Conductor rules (see desktop/bootstrap.js) —
 * reusing the exact better-sqlite3 binary bundled with the standalone
 * server, already rebuilt for Electron's Node ABI (see build.js), so this
 * doesn't need its own separate native dependency. */
function bootstrapDatabaseIfNeeded() {
  if (fs.existsSync(dbPath)) return;
  const bootstrap = require("./bootstrap.js");
  bootstrap.run({ standaloneDir, migrationsDir, globalRulesPath, dbPath });
}

function waitForServerReady(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get({ host: "127.0.0.1", port, path: "/", timeout: 2000 }, (res) => {
        res.destroy();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) return reject(new Error("KiwiFlow server did not start in time"));
        setTimeout(attempt, 300);
      });
      req.on("timeout", () => {
        req.destroy();
        if (Date.now() > deadline) return reject(new Error("KiwiFlow server did not start in time"));
        setTimeout(attempt, 300);
      });
    };
    attempt();
  });
}

async function startServer() {
  const port = await findFreePort();
  const config = loadOrCreateConfig();
  const serverEntry = path.join(standaloneDir, "server.js");

  serverProcess = fork(serverEntry, [], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      KIWIFLOW_DESKTOP: "1",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      DATABASE_URL: `file:${dbPath}`,
      AUTH_SECRET: config.authSecret,
      NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${port}`,
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  serverProcess.stdout?.on("data", (d) => console.log(`[kiwiflow-server] ${d}`.trimEnd()));
  serverProcess.stderr?.on("data", (d) => console.error(`[kiwiflow-server] ${d}`.trimEnd()));

  await waitForServerReady(port, 30000);
  return port;
}

async function createWindow() {
  bootstrapDatabaseIfNeeded();
  const port = await startServer();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    icon: path.join(__dirname, "build", "icon.ico"),
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  mainWindow.setMenuBarVisibility(false);
  // Anything that isn't this app's own local server (e.g. a link out to a
  // real website) opens in the user's real browser instead of hijacking
  // this window into a general-purpose one.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(() => {
  createWindow().catch((err) => {
    console.error("Failed to start KiwiFlow:", err);
    app.quit();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});

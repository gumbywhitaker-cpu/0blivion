const { app, BrowserWindow, shell, Menu } = require("electron");

// This app is a thin native window around the real, hosted KiwiFlow app.
// It does not run a local server or store its own data — every grower,
// contractor, and admin using this desktop shortcut sees the same live,
// shared database as anyone using a browser. That's deliberate: KiwiFlow's
// whole point is one shared record between orgs, which a disconnected
// local copy would break.
const APP_URL = "https://kiwiflow.hatchable.site";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: "KiwiFlow",
    icon: __dirname + "/icon.png",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(APP_URL);

  // Open any link that tries to open a new window (target=_blank) in the
  // user's real browser instead of a second Electron window — this app
  // isn't a full browser, just a shortcut into KiwiFlow itself.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Keep navigation inside the app's own domain; anything else (an
  // external link clicked inside the page) opens in the real browser.
  win.webContents.on("will-navigate", (event, url) => {
    const target = new URL(url);
    const allowed = new URL(APP_URL);
    if (target.hostname !== allowed.hostname) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  return win;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

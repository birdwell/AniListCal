import { exec } from "child_process";
import fs from "fs";
import path from "path";

const DEV_BROWSER_LOCK = path.resolve(process.cwd(), ".dev-browser-opened");

/** Open a URL in the OS default browser (macOS / Windows / Linux). */
export function openInSystemBrowser(url: string): void {
  const escaped = url.replace(/"/g, '\\"');
  const command =
    process.platform === "darwin"
      ? `open "${escaped}"`
      : process.platform === "win32"
        ? `start "" "${escaped}"`
        : `xdg-open "${escaped}"`;

  exec(command, (error) => {
    if (error) {
      console.warn(`[dev] Could not open browser automatically: ${error.message}`);
      console.warn(`[dev] Open manually: ${url}`);
    }
  });
}

export function getLocalDevAppUrl(port: number): string {
  return `http://localhost:${port}/login`;
}

/**
 * Open the dev app in the system browser at most once per nodemon session.
 * Nodemon restarts the server on file changes; without this guard each restart
 * would spawn another browser tab.
 */
export function openDevBrowserOnce(url: string): void {
  if (process.env.OPEN_BROWSER === "false") return;

  const sessionId = String(process.ppid);
  try {
    if (fs.existsSync(DEV_BROWSER_LOCK)) {
      const previous = fs.readFileSync(DEV_BROWSER_LOCK, "utf8").trim();
      if (previous === sessionId) return;
    }
    fs.writeFileSync(DEV_BROWSER_LOCK, sessionId);
  } catch (error) {
    console.warn(
      `[dev] Could not update browser lock file: ${error instanceof Error ? error.message : error}`
    );
  }

  openInSystemBrowser(url);
}

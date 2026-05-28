import { exec } from "child_process";

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

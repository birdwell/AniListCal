/// <reference types="vitest/config" />
// Vite 8 (Rolldown): intentional v6→v8 jump; CI build + 68 tests pass. See docs/vite-8-upgrade-notes.md.
// @vitejs/plugin-react v6 uses Oxc (no Babel). Use @rolldown/plugin-babel if Babel plugins are needed later.
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import graphql from "@rollup/plugin-graphql";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname;
const isVitest = process.env.VITEST === "true" || process.env.VITEST === "1";

export default defineConfig({
  envDir: projectRoot,
  plugins: [
    react(),
    graphql(),
    ...(isVitest
      ? []
      : [
          sentryVitePlugin({
            org: "birdwell-labs",
            project: "anilistcal",
          }),
        ]),
  ],
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "client", "src"),
    },
  },
  root: path.resolve(projectRoot, "client"),
  build: {
    outDir: path.resolve(projectRoot, "dist/public"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5001,
    strictPort: true,
    // Browser open is handled by the Express dev server (`openDevBrowserOnce` in server/index.ts).
    // OPEN_BROWSER only applies to `yarn dev`, not `yarn client`.
    open: false,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  css: {
    devSourcemap: process.env.NODE_ENV !== "production",
  },
  test: {
    root: projectRoot,
    include: [
      "client/**/*.{test,spec}.{ts,tsx}",
      "server/**/*.test.ts",
    ],
    environment: "jsdom",
    globals: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html"],
      all: true,
      include: ["client/src/**/*.{ts,tsx}", "server/**/*.ts"],
      exclude: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
    },
  },
});

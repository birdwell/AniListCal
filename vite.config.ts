/// <reference types="vitest/config" />
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import graphql from "@rollup/plugin-graphql";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname;

export default defineConfig({
  envDir: projectRoot,
  plugins: [
    react(),
    graphql(),
    sentryVitePlugin({
      org: "birdwell-labs",
      project: "anilistcal",
    }),
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
    open: process.env.OPEN_BROWSER === "false" ? false : "/login",
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
      exclude: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
    },
  },
});

/// <reference types="vitest/config" />
// Vite 8 (Rolldown): intentional v6→v8 jump; CI build + 68 tests pass. See docs/vite-8-upgrade-notes.md.
// @vitejs/plugin-react v6 uses Oxc (no Babel). Use @rolldown/plugin-babel if Babel plugins are needed later.
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import graphql from "@rollup/plugin-graphql";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname;
const isVitest = process.env.VITEST === "true" || process.env.VITEST === "1";

/** Matches `--primary` in client/src/index.css (hsl 225 55% 40%). */
const PWA_THEME_COLOR = "#2E4A9E";

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
          VitePWA({
            registerType: "autoUpdate",
            includeAssets: [
              "favicon-32x32.png",
              "apple-touch-icon.png",
              "robots.txt",
            ],
            manifest: {
              name: "AniListCal",
              short_name: "AniListCal",
              description:
                "Track your anime watching schedule with your AniList list.",
              theme_color: PWA_THEME_COLOR,
              background_color: "#ffffff",
              display: "standalone",
              start_url: "/",
              scope: "/",
              icons: [
                {
                  src: "pwa-192x192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
                {
                  src: "pwa-512x512.png",
                  sizes: "512x512",
                  type: "image/png",
                },
                {
                  src: "pwa-512x512-maskable.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "maskable",
                },
              ],
            },
            workbox: {
              globPatterns: [
                "**/*.{js,css,html,ico,png,svg,webmanifest,woff2}",
              ],
              navigateFallback: "/index.html",
              // Keep API and auth flows on the network; never serve SPA HTML for them.
              navigateFallbackDenylist: [/^\/api\//],
            },
            devOptions: {
              enabled: false,
            },
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
      include: ["client/src/**/*.{ts,tsx}", "server/**/*.ts"],
      exclude: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
    },
  },
});

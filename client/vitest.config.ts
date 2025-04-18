/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url'; // Import necessary function

// Calculate __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom', // Use JSDOM for simulating browser environment
        setupFiles: './src/tests/setup.ts', // Setup file for RTL cleanup etc.
        css: false, // Disable CSS processing if not needed for tests
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: [
                'src/**/*.{ts,tsx}', // Include client source files
                // Exclude specific files if necessary
                '!src/main.tsx', // Usually no logic here
                '!src/vite-env.d.ts',
                '!src/components/ui/**', // Exclude generated UI components if desired
                '!src/tests/**' // Exclude test setup files
            ],
            exclude: [
                '**/node_modules/**',
                '**/dist/**',
                '**/coverage/**',
            ],
            all: true,
            // thresholds: {
            //   lines: 80,
            //   functions: 80,
            //   branches: 80,
            //   statements: 80,
            // }
        },
    },
}); 
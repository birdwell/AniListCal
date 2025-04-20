import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true, // Use global APIs like describe, it, expect
        environment: 'node', // Set environment to Node.js for server tests
        // Explicitly configure environment options for node
        environmentOptions: {
            node: {
                // Add any specific node options if needed, e.g., experimental features
                // For now, just defining the block can sometimes help resolution
            }
        },
        coverage: {
            provider: 'v8', // Use V8 coverage provider
            reporter: ['text', 'json', 'html'], // Output formats
            include: [
                'server/**/*.ts', // Include all server files
                // Exclude specific files if necessary (e.g., config, index)
                '!server/index.ts',
                '!server/vite.ts',
                '!server/routes/config.ts',
                '!server/routes/index.ts',
                '!server/**/*.sql',
            ],
            exclude: [
                '**/node_modules/**',
                '**/dist/**',
                '**/coverage/**',
                '**/.persist-storage/**' // Exclude the storage directory
            ],
            all: true, // Report coverage for all included files, even untested ones
            // Set coverage thresholds (optional but recommended)
            // thresholds: {
            //   lines: 80,
            //   functions: 80,
            //   branches: 80,
            //   statements: 80,
            // }
        },
        // Optional: Setup file for mocking or global setup
        // setupFiles: ['./server/tests/setup.ts'],
    },
}); 
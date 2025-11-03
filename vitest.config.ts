import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./__tests__/helpers/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
    
    // PERFORMANCE OPTIMIZATIONS
    pool: 'threads',              // Use threads for faster parallel execution
    poolOptions: {
      threads: {
        singleThread: false,      // Run tests in parallel
        isolate: false,           // Don't isolate each test (faster, but watch for shared state)
      },
    },
    
    // Faster test discovery - only scan test directories
    include: ['**/__tests__/**/*.test.ts'],
    testTimeout: 5000,
    
    // Faster TypeScript handling
    transformMode: {
      web: [/\.[jt]sx?$/],
      ssr: [/\.[jt]sx?$/],
    },
    
    // Cache configuration
    cache: {
      dir: '.vitest',
    },
    
    // Skip coverage in watch mode for speed (only run in CI)
    coverage: {
      enabled: !!process.env.CI,  // Only run coverage in CI
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        'e2e/',
        '*.config.{js,ts}',
        'scripts/',
      ],
    },
    
    // Faster file watching
    watchExclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});


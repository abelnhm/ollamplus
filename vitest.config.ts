import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['server/**/*.test.ts', 'shared/**/*.test.ts', 'client/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['server/src/'],
      exclude: [
        'server/src/**/*.test.ts', 
        'server/src/db/',
        'client/**/*.test.ts'
      ],
    },
    setupFiles: ['./server/src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './server/src'),
    },
  },
});

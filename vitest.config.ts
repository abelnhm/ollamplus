import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'server/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['server/src/'],
      exclude: [
        'server/src/**/*.test.ts', 
        'server/src/db/',
        'tests/'
      ],
    },
    setupFiles: ['tests/setup-global.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './server/src'),
    },
  },
});

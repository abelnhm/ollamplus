import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.ts', 'shared/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['server/src/'],
      exclude: ['server/src/**/*.test.ts', 'server/src/db/'],
    },
    setupFiles: ['./server/src/test/setup.ts'],
  },
});

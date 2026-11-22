import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
    assetsInlineLimit: 4096,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});

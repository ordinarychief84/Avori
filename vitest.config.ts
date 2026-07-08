import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Manual @/ alias (vite-tsconfig-paths would pull an incompatible Vite/esbuild
// against the pinned esbuild 0.24 used by the widget build).
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
  },
});

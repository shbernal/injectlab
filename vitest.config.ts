import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Tests exercise source, not `dist`, so `pnpm test` never depends on a build having
      // run first and a stale `dist` can never make a red test look green.
      '@injectlab/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/*/tests/**/*.test.ts'],
  },
});

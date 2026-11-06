import { defineConfig } from "vitest/config";

/**
 * Test configuration for `@avandar/magpie`.
 *
 * The repository's own tooling under `scripts/` has its own run
 * (`pnpm test:scripts`), so this one covers `src/` only.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});

import { defineConfig } from "vitest/config";

/**
 * Test configuration for `@avandar/crow`.
 *
 * The repository's own tooling under `scripts/` has its own run
 * (`pnpm test:scripts`), so this one covers `src/` and `extensions/`.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "extensions/**/*.test.ts"],
    passWithNoTests: true,
  },
});

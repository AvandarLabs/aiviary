import { defineConfig } from "vitest/config";

/**
 * Test configuration for the repository's own tooling under `scripts/`.
 *
 * It is separate from the project's own tests so it runs the same way in every
 * layout: at the root of a single package, and at the root of a workspace
 * whose packages each carry their own config. `pnpm test:scripts` runs it from
 * the repository root.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["scripts/**/*.test.ts"],
  },
});

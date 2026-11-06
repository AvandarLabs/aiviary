#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runBirdSetup } from "@avandar/aiviary-core";
import type { SetupBird } from "@avandar/aiviary-core";

/**
 * `pnpm birds`: link this checkout's birds onto your PATH, unlink them, or
 * list them. The birds are whatever lives under `birds/`, each named by its
 * package's `bin`. Run `pnpm birds --help` for the details.
 */
const BIRDS_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../birds",
);

const birds: SetupBird[] = readdirSync(BIRDS_DIR, { withFileTypes: true })
  .filter((entry) => {
    return entry.isDirectory();
  })
  .flatMap((entry) => {
    const packageDir = join(BIRDS_DIR, entry.name);
    const manifest = JSON.parse(
      readFileSync(join(packageDir, "package.json"), "utf8"),
    ) as { bin?: Record<string, string> };
    return Object.entries(manifest.bin ?? {}).map(([name, binPath]) => {
      return { name, entryPath: join(packageDir, binPath) };
    });
  })
  .sort((left, right) => {
    return left.name.localeCompare(right.name);
  });

process.exitCode = await runBirdSetup({
  command: "pnpm birds",
  birds,
  argv: process.argv.slice(2),
});

#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runBird } from "@avandar/aiviary-core";
import { CROW_BRAND } from "./brand.ts";

/**
 * `crow`: Crow, a pi harness of its own.
 *
 * Everything that makes Crow different from other birds lives in
 * this package: `src/brand.ts` (how it looks), `SYSTEM.md` (how it works),
 * `extensions/` (what it enforces), and `skills/` and `prompts/` when it has
 * any. The launcher in `@avandar/aiviary-core` hands them to pi.
 */
const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(
  readFileSync(join(packageDir, "package.json"), "utf8"),
) as { version: string };

process.exitCode = await runBird(
  // Crow works on Avandar code, so it loads its own skills and the project's,
  // never the personal skills installed machine-wide.
  { brand: CROW_BRAND, packageDir, version, skillPolicy: "own-and-project" },
  process.argv.slice(2),
);

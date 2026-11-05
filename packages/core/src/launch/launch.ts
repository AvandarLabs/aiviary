import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { constants, homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_ENV_VAR_NAME, brandToEnvValue } from "../brand/brand.ts";
import type { BirdBrand } from "../brand/brand.ts";
import type { BirdSkillPolicy } from "../home/home.ts";

/** The pi package every bird runs on. */
export const PI_PACKAGE_NAME = "@earendil-works/pi-coding-agent";

/**
 * A bird: its brand, and the package directory its resources live in.
 *
 * Inside `packageDir`, a bird may ship any of:
 * - `SYSTEM.md`: appended to pi's system prompt.
 * - `extensions/*.ts`: pi extensions, loaded after the branding one.
 * - `skills/`: skills only this bird gets.
 * - `prompts/`: prompt templates only this bird gets.
 */
export type BirdDefinition = {
  brand: BirdBrand;
  packageDir: string;
  /** The bird's version, shown in its header and by `--version`. */
  version: string;
  /** Which skills the bird loads besides its own. Defaults to `everything`. */
  skillPolicy?: BirdSkillPolicy;
};

/** The resources a bird ships, found on disk. */
export type BirdResources = {
  systemPromptPath: string | undefined;
  extensionPaths: string[];
  skillsDir: string | undefined;
  promptsDir: string | undefined;
};

/** The directory holding this package (`packages/core`). */
const CORE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** The extension every bird loads first: its header, title, and theme. */
export const BRANDING_EXTENSION_PATH = join(
  CORE_DIR,
  "extensions",
  "branding.ts",
);

/**
 * The bird's home directory: `$<NAME>_HOME` when set, `~/.<name>` otherwise.
 * pi's own state (settings, sessions, logins, packages) lives in its `agent/`
 * subdirectory, so a bird never shares any of it with plain pi.
 *
 * @param options The bird's name, the environment, and the home directory.
 * @returns The bird's home directory.
 */
export function resolveBirdHome(options: {
  name: string;
  env: Readonly<Record<string, string | undefined>>;
  userHome?: string;
}): string {
  const { name, env, userHome = homedir() } = options;
  const override = env[buildHomeEnvVarName(name)];
  return override !== undefined && override !== ""
    ? resolve(override)
    : join(userHome, `.${name}`);
}

/**
 * The prefix a bird's own environment variables carry: `CROW_`. A bird reads
 * its home from `<PREFIX>HOME` and pi's settings from `<PREFIX><SETTING>`, so
 * no variable meant for one bird (or for plain pi) reaches another.
 *
 * @param name The bird's command name.
 * @returns The prefix.
 */
export function buildEnvPrefix(name: string): string {
  return `${name.toUpperCase().replaceAll("-", "_")}_`;
}

/**
 * The environment variable that moves a bird's home: `CROW_HOME`.
 *
 * @param name The bird's command name.
 * @returns The variable's name.
 */
export function buildHomeEnvVarName(name: string): string {
  return `${buildEnvPrefix(name)}HOME`;
}

/**
 * Finds the resources a bird ships in its package directory.
 *
 * @param packageDir The bird's package directory.
 * @returns What exists, ready to hand to pi.
 */
export function findBirdResources(packageDir: string): BirdResources {
  const systemPromptPath = join(packageDir, "SYSTEM.md");
  const extensionsDir = join(packageDir, "extensions");
  const skillsDir = join(packageDir, "skills");
  const promptsDir = join(packageDir, "prompts");
  const extensionPaths = existsSync(extensionsDir)
    ? readdirSync(extensionsDir)
        .filter((file) => {
          return file.endsWith(".ts") && !file.endsWith(".test.ts");
        })
        .sort()
        .map((file) => {
          return join(extensionsDir, file);
        })
    : [];
  return {
    systemPromptPath: existsSync(systemPromptPath)
      ? systemPromptPath
      : undefined,
    extensionPaths,
    skillsDir: existsSync(skillsDir) ? skillsDir : undefined,
    promptsDir: existsSync(promptsDir) ? promptsDir : undefined,
  };
}

/**
 * The arguments pi is started with: the bird's resources first, then
 * everything the person typed, unchanged.
 *
 * @param options The bird's resources and the person's arguments.
 * @returns pi's arguments.
 */
export function buildPiArgs(options: {
  resources: Readonly<BirdResources>;
  userArgs: readonly string[];
}): string[] {
  const { resources, userArgs } = options;
  const args = ["--extension", BRANDING_EXTENSION_PATH];
  resources.extensionPaths.forEach((path) => {
    args.push("--extension", path);
  });
  if (resources.systemPromptPath !== undefined) {
    args.push("--append-system-prompt", resources.systemPromptPath);
  }
  if (resources.skillsDir !== undefined) {
    args.push("--skill", resources.skillsDir);
  }
  if (resources.promptsDir !== undefined) {
    args.push("--prompt-template", resources.promptsDir);
  }
  return [...args, ...userArgs];
}

/** The prefix of every variable pi reads for its own configuration. */
const PI_ENV_PREFIX = "PI_";

/**
 * The environment pi runs in, which keeps every bird independent.
 *
 * - Every inherited `PI_*` variable is dropped: it was set for plain pi, or by
 *   a parent pi session, and must not configure a bird. Left in,
 *   `PI_CODING_AGENT_SESSION_DIR` alone would make every bird share one
 *   session store.
 * - The bird's own variables become pi's: `CROW_OFFLINE=1` reaches crow's pi
 *   as `PI_OFFLINE=1`, and no other bird sees it.
 * - The home is always the bird's (`PI_CODING_AGENT_DIR`), and the brand and
 *   version are handed to the branding extension.
 * - Everything else (`PATH`, provider keys such as `ANTHROPIC_API_KEY`) is
 *   the person's shell environment and passes through unchanged.
 *
 * @param options The bird, its home, and the inherited environment.
 * @returns pi's environment.
 */
export function buildPiEnv(options: {
  bird: Readonly<BirdDefinition>;
  birdHome: string;
  env: Readonly<Record<string, string | undefined>>;
}): Record<string, string | undefined> {
  const { bird, birdHome, env } = options;
  const birdPrefix = buildEnvPrefix(bird.brand.name);
  const piEnv: Record<string, string | undefined> = {};
  Object.entries(env).forEach(([key, value]) => {
    if (!key.startsWith(PI_ENV_PREFIX)) {
      piEnv[key] = value;
    }
  });
  Object.entries(env).forEach(([key, value]) => {
    if (
      key.startsWith(birdPrefix) &&
      key !== buildHomeEnvVarName(bird.brand.name)
    ) {
      piEnv[`${PI_ENV_PREFIX}${key.slice(birdPrefix.length)}`] = value;
    }
  });
  return {
    ...piEnv,
    PI_CODING_AGENT_DIR: join(birdHome, "agent"),
    // pi's update notice would tell people to update "pi", not the bird.
    PI_SKIP_VERSION_CHECK: piEnv["PI_SKIP_VERSION_CHECK"] ?? "1",
    [BRAND_ENV_VAR_NAME]: brandToEnvValue(bird.brand),
    AIVIARY_BIRD_VERSION: bird.version,
  };
}

/** Where the copy of pi this package depends on is, and which version. */
export type PiPackage = { cliPath: string; version: string };

/**
 * Finds the copy of pi this package depends on.
 *
 * @returns The absolute path of pi's CLI script, and pi's version.
 */
export function resolvePiPackage(): PiPackage {
  const entry = fileURLToPath(import.meta.resolve(PI_PACKAGE_NAME));
  let dir = dirname(entry);
  while (dir !== dirname(dir)) {
    const manifestPath = join(dir, "package.json");
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
        name?: string;
        version?: string;
        bin?: Record<string, string>;
      };
      if (manifest.name === PI_PACKAGE_NAME && manifest.bin?.["pi"]) {
        return {
          cliPath: join(dir, manifest.bin["pi"]),
          version: manifest.version ?? "unknown",
        };
      }
    }
    dir = dirname(dir);
  }
  throw new Error(`could not find the ${PI_PACKAGE_NAME} package`);
}

/**
 * Runs pi as the bird, attached to this terminal, and resolves with its exit
 * code. A signal that ends pi ends with the conventional `128 + signal` code.
 *
 * @param options pi's arguments and environment.
 * @returns pi's exit code.
 */
export function runPi(options: {
  args: readonly string[];
  env: Readonly<Record<string, string | undefined>>;
}): Promise<number> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      [resolvePiPackage().cliPath, ...options.args],
      {
        stdio: "inherit",
        env: options.env,
      },
    );
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      resolvePromise(signal ? 128 + _signalNumber(signal) : (code ?? 0));
    });
  });
}

/** The number of a signal, or 1 when the platform does not know it. */
function _signalNumber(signal: NodeJS.Signals): number {
  return constants.signals[signal] ?? 1;
}

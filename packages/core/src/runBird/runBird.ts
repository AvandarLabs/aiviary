import { homedir } from "node:os";
import { prepareBirdHome } from "../home/home.ts";
import {
  buildEnvPrefix,
  buildHomeEnvVarName,
  buildPiArgs,
  buildPiEnv,
  findBirdResources,
  resolveBirdHome,
  resolvePiPackage,
  runPi,
} from "../launch/launch.ts";
import type { BirdDefinition } from "../launch/launch.ts";
import { Output } from "../output/output.ts";

/** What a bird's command line asks for. */
export type BirdRequest = "help" | "version" | "pi-help" | "launch";

/**
 * Decides what a bird's arguments ask for. Help wins over everything, and
 * nothing after `--` counts, because pi treats it as a message.
 *
 * @param argv The arguments after the command name.
 * @returns What to do.
 */
export function parseBirdRequest(argv: readonly string[]): BirdRequest {
  const endOfOptions = argv.indexOf("--");
  const options = endOfOptions === -1 ? argv : argv.slice(0, endOfOptions);
  if (options.includes("-h") || options.includes("--help")) {
    return "help";
  }
  if (options.includes("--pi-help")) {
    return "pi-help";
  }
  if (
    options.length === 1 &&
    (options[0] === "-v" || options[0] === "--version")
  ) {
    return "version";
  }
  return "launch";
}

/**
 * The bird's `--help`.
 *
 * @param bird The bird.
 * @returns The help text.
 */
export function buildBirdHelp(bird: Readonly<BirdDefinition>): string {
  const { name, displayName, tagline } = bird.brand;
  return `${displayName}: ${tagline}

Usage:
  ${name} [options] [@files...] [messages...]

${displayName} runs on the pi coding agent and accepts every pi option. The
common ones are below; \`${name} --pi-help\` lists them all (that help says
"pi" where it means ${name}).

Options:
  -h, --help             Show this help.
  -v, --version          Show ${name}'s version and the pi version it runs on.
  --pi-help              Show every option of the pi engine.
  -c, --continue         Continue the most recent session in this directory.
  -r, --resume           Pick a session to resume.
  -p, --print            Answer one prompt and exit, without the terminal UI.
  --model <pattern>      The model to use, for example "anthropic/*opus*".
  --thinking <level>     off, minimal, low, medium, high, xhigh, or max.

Environment:
  ${buildHomeEnvVarName(name).padEnd(20)} Where ${name} keeps its settings, sessions, logins,
                       and skills (default: ~/.${name}).
  ${`${buildEnvPrefix(name)}<SETTING>`.padEnd(20)} Any pi environment setting, for ${name} only:
                       ${buildEnvPrefix(name)}OFFLINE=1 is pi's PI_OFFLINE=1. PI_*
                       variables are ignored.

${displayName} is an independent agent. Its configuration is never shared
with pi or another bird: change it inside ${name} (/settings, /login) or
in ~/.${name}/agent.

Examples:
  ${name}                                 Start an interactive session.
  ${name} -c                              Pick up where you left off.
  ${name} -p "summarize the open TODOs"   Answer once and exit.
`;
}

/**
 * Runs a bird's command line: help, version, or pi as the bird.
 *
 * @param bird The bird to run.
 * @param argv The arguments after the command name.
 * @returns The exit code.
 */
export async function runBird(
  bird: Readonly<BirdDefinition>,
  argv: readonly string[],
): Promise<number> {
  const request = parseBirdRequest(argv);
  if (request === "help") {
    process.stdout.write(buildBirdHelp(bird));
    return 0;
  }
  try {
    if (request === "version") {
      const pi = resolvePiPackage();
      process.stdout.write(
        `${bird.brand.name} ${bird.version} (pi ${pi.version})\n`,
      );
      return 0;
    }
    return await _launch(bird, request === "pi-help" ? ["--help"] : argv);
  } catch (error: unknown) {
    Output.error({
      command: bird.brand.name,
      message: error instanceof Error ? error.message : String(error),
      fix: "Run pnpm install in the bird's repository, then try again.",
    });
    return 1;
  }
}

/** Prepares the bird's home and runs pi in it. */
async function _launch(
  bird: Readonly<BirdDefinition>,
  userArgs: readonly string[],
): Promise<number> {
  const birdHome = resolveBirdHome({
    name: bird.brand.name,
    env: process.env,
  });
  Output.progress(
    `Starting ${bird.brand.displayName} in ${_tildify(birdHome)}`,
  );
  const { isNewHome } = await prepareBirdHome({
    brand: bird.brand,
    birdHome,
    skillPolicy: bird.skillPolicy,
  });
  if (isNewHome) {
    Output.success(
      `Created ${_tildify(birdHome)}. Run /login inside ${bird.brand.name} to connect a model provider.`,
    );
  }
  return runPi({
    args: buildPiArgs({
      resources: findBirdResources(bird.packageDir),
      userArgs,
    }),
    env: buildPiEnv({ bird, birdHome, env: process.env }),
  });
}

/** `path` with the home directory shown as `~`. */
function _tildify(path: string): string {
  const home = homedir();
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path;
}

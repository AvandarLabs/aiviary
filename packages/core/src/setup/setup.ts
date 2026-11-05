import { chmodSync, existsSync, lstatSync, readlinkSync } from "node:fs";
import { mkdir, symlink, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { Output } from "../output/output.ts";
import { selectOption } from "../select/select.ts";

/** A bird the setup tool can link: its command name and entry point. */
export type SetupBird = { name: string; entryPath: string };

/** The setup tool's actions. */
export const SETUP_ACTIONS = ["link", "unlink", "list"] as const;

/** One setup action. */
export type SetupAction = (typeof SETUP_ACTIONS)[number];

/** A parsed setup command line. */
export type SetupRequest = {
  action: SetupAction | undefined;
  bird: string | undefined;
  binDir: string | undefined;
  isHelp: boolean;
};

/** Whether a bird's command is linked, and where. */
export type LinkState = "linked" | "not linked" | "blocked";

/**
 * The bin directory to link into when none is passed: `$BIN_DIR`, else
 * `~/.local/bin`.
 *
 * @param env The environment.
 * @returns The bin directory.
 */
export function defaultBinDir(
  env: Readonly<Record<string, string | undefined>>,
): string {
  const fromEnv = env["BIN_DIR"];
  return fromEnv !== undefined && fromEnv !== ""
    ? resolve(fromEnv)
    : join(homedir(), ".local", "bin");
}

/**
 * Parses the setup tool's arguments. Help wins over everything else.
 *
 * @param argv The arguments after the command name.
 * @returns The request, or an error message for an invalid one.
 */
export function parseSetupArgs(
  argv: readonly string[],
): SetupRequest | { error: string } {
  try {
    const { values, positionals } = parseArgs({
      args: [...argv],
      allowPositionals: true,
      options: {
        "bin-dir": { type: "string" },
        help: { type: "boolean", short: "h" },
      },
    });
    const [action, bird, ...extra] = positionals;
    if (values.help === true) {
      return {
        action: undefined,
        bird: undefined,
        binDir: undefined,
        isHelp: true,
      };
    }
    if (action !== undefined && !_isSetupAction(action)) {
      return { error: `unknown command "${action}"` };
    }
    if (extra.length > 0 || (action === "list" && bird !== undefined)) {
      return { error: `unexpected argument "${extra[0] ?? bird}"` };
    }
    return { action, bird, binDir: values["bin-dir"], isHelp: false };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * The setup tool's `--help`.
 *
 * @param options The command name and the birds it can link.
 * @returns The help text.
 */
export function buildSetupHelp(options: {
  command: string;
  birds: readonly SetupBird[];
}): string {
  const { command, birds } = options;
  const names = birds.map((bird) => {
    return bird.name;
  });
  const example = names[0] ?? "crow";
  return `${command}: put birds on your PATH by linking their commands.

Usage:
  ${command} [link|unlink|list] [bird] [--bin-dir <dir>]

With no arguments on a terminal, it asks what to do. Every answer can also be
passed as an argument, which is how scripts and agents use it.

Commands:
  link [bird]       Link the bird's command into the bin directory. The link
                    points at this checkout, so edits take effect at once.
  unlink [bird]     Remove a link this tool made. Anything else is left alone.
  list              Print each bird, whether it is linked, and the link path,
                    tab-separated on stdout.

Arguments:
  bird              One of: ${names.join(", ")}.

Options:
  --bin-dir <dir>   Where to link commands (default: $BIN_DIR, else
                    ~/.local/bin). It should be on your PATH.
  -h, --help        Show this help.

Examples:
  ${command} link ${example}
  ${command} unlink ${example} --bin-dir ~/bin
  ${command} list
`;
}

/**
 * Whether `linkPath` is this tool's link to `entryPath`, missing, or taken by
 * something else.
 *
 * @param options The link's path and the entry it should point at.
 * @returns The link's state.
 */
export function readLinkState(options: {
  linkPath: string;
  entryPath: string;
}): LinkState {
  const { linkPath, entryPath } = options;
  if (!existsSync(linkPath) && !_isSymlink(linkPath)) {
    return "not linked";
  }
  return _isSymlink(linkPath) &&
    resolve(join(linkPath, ".."), readlinkSync(linkPath)) === entryPath
    ? "linked"
    : "blocked";
}

/**
 * Runs the setup tool.
 *
 * @param options The command name, the birds, and the arguments.
 * @returns The exit code.
 */
export async function runBirdSetup(options: {
  command: string;
  birds: readonly SetupBird[];
  argv: readonly string[];
}): Promise<number> {
  const { command, birds, argv } = options;
  const help = buildSetupHelp({ command, birds });
  const request = parseSetupArgs(argv);
  if ("error" in request) {
    process.stderr.write(help);
    Output.error({
      command,
      message: request.error,
      fix: `Run ${command} --help for the commands and options.`,
    });
    return 2;
  }
  if (request.isHelp) {
    process.stdout.write(help);
    return 0;
  }
  const isInteractive =
    process.stdin.isTTY === true && process.stderr.isTTY === true;
  const isBare = argv.length === 0;
  try {
    const action = request.action ?? (await _askAction(isInteractive));
    if (action === undefined) {
      process.stderr.write(help);
      Output.error({
        command,
        message: "no command was given",
        fix: `Pass one: ${command} link <bird>, ${command} unlink <bird>, or ${command} list.`,
      });
      return 2;
    }
    if (action !== "list" && request.bird === undefined && !isInteractive) {
      process.stderr.write(help);
      Output.error({
        command,
        message: "no bird was given",
        fix: `Pass one: ${command} ${action} ${birds[0]?.name ?? "<bird>"}`,
      });
      return 2;
    }
    const isWizard = isInteractive && (isBare || request.bird === undefined);
    const bird =
      action === "list"
        ? undefined
        : await _resolveBird({
            command,
            action,
            birds,
            name: request.bird,
            isInteractive,
          });
    const binDir =
      request.binDir !== undefined
        ? resolve(request.binDir)
        : isWizard
          ? await _askBinDir(defaultBinDir(process.env))
          : defaultBinDir(process.env);
    if (bird === undefined) {
      _list(birds, binDir);
      return 0;
    }
    return action === "link"
      ? await _link(bird, binDir)
      : await _unlink(bird, binDir);
  } catch (error: unknown) {
    if (isInteractive) {
      // A cancelled prompt leaves the cursor at the end of its line.
      process.stderr.write("\n");
    }
    Output.error({
      command,
      message: error instanceof Error ? error.message : String(error),
      fix: `Run ${command} --help, then try again with the arguments it shows.`,
    });
    return 1;
  }
}

/** Whether `value` is a setup action. */
function _isSetupAction(value: string): value is SetupAction {
  return (SETUP_ACTIONS as readonly string[]).includes(value);
}

/** Whether `path` is a symbolic link, dangling or not. */
function _isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

/** Asks which action to run, or `undefined` with nobody to ask. */
async function _askAction(
  isInteractive: boolean,
): Promise<SetupAction | undefined> {
  if (!isInteractive) {
    return undefined;
  }
  const index = await selectOption({
    title: "What do you want to do?",
    labels: [
      "link: put a bird on your PATH",
      "unlink: take a bird off your PATH",
      "list: show which birds are linked",
    ],
  });
  if (index === undefined) {
    throw new Error("cancelled");
  }
  return SETUP_ACTIONS[index];
}

/** Asks where to link, offering the default for editing. */
async function _askBinDir(fallback: string): Promise<string> {
  const terminal = createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  try {
    const answering = terminal.question("Bin directory (Enter keeps it): ");
    terminal.write(fallback);
    const answer = (await answering).trim();
    return resolve(
      answer === "" ? fallback : answer.replace(/^~(?=\/|$)/, homedir()),
    );
  } finally {
    terminal.close();
  }
}

/** The bird the request names, or one the person picks. */
async function _resolveBird(options: {
  command: string;
  action: SetupAction;
  birds: readonly SetupBird[];
  name: string | undefined;
  isInteractive: boolean;
}): Promise<SetupBird> {
  const { command, action, birds, name, isInteractive } = options;
  if (name !== undefined) {
    const found = birds.find((bird) => {
      return bird.name === name;
    });
    if (found === undefined) {
      throw new Error(`there is no bird called "${name}"`);
    }
    return found;
  }
  if (!isInteractive) {
    throw new Error(
      `no bird was given. Pass one: ${command} ${action} ${birds[0]?.name ?? "<bird>"}`,
    );
  }
  const index = await selectOption({
    title: `Which bird do you want to ${action}?`,
    labels: birds.map((bird) => {
      return bird.name;
    }),
  });
  if (index === undefined) {
    throw new Error("cancelled");
  }
  return birds[index]!;
}

/** Prints each bird's link state on stdout. */
function _list(birds: readonly SetupBird[], binDir: string): void {
  birds.forEach((bird) => {
    const linkPath = join(binDir, bird.name);
    const state = readLinkState({ linkPath, entryPath: bird.entryPath });
    process.stdout.write(`${bird.name}\t${state}\t${linkPath}\n`);
  });
}

/** Links a bird's command into `binDir`. */
async function _link(bird: SetupBird, binDir: string): Promise<number> {
  const linkPath = join(binDir, bird.name);
  Output.progress(`Linking ${bird.name} into ${binDir}`);
  const state = readLinkState({ linkPath, entryPath: bird.entryPath });
  if (state === "blocked") {
    throw new Error(`${linkPath} already exists and is not this bird's link`);
  }
  chmodSync(bird.entryPath, 0o755);
  if (state === "not linked") {
    await mkdir(binDir, { recursive: true });
    await symlink(bird.entryPath, linkPath);
  }
  Output.success(`${bird.name} is linked: ${linkPath} -> ${bird.entryPath}`);
  if (!(process.env["PATH"] ?? "").split(delimiter).includes(binDir)) {
    Output.warning(
      `${binDir} is not on your PATH, so run ${linkPath} directly or add it to PATH.`,
    );
  }
  return 0;
}

/** Removes a bird's link from `binDir`, if it is this tool's. */
async function _unlink(bird: SetupBird, binDir: string): Promise<number> {
  const linkPath = join(binDir, bird.name);
  Output.progress(`Unlinking ${bird.name} from ${binDir}`);
  const state = readLinkState({ linkPath, entryPath: bird.entryPath });
  if (state === "blocked") {
    throw new Error(
      `${linkPath} is not this bird's link, so it was left alone`,
    );
  }
  if (state === "linked") {
    await unlink(linkPath);
  }
  Output.success(
    state === "linked"
      ? `${bird.name} is unlinked.`
      : `${bird.name} was not linked.`,
  );
  return 0;
}

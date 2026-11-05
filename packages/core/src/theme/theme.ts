import { styleText } from "node:util";

/** The roles a piece of terminal output plays. See `docs/rules/cli-ux.md`. */
export type ThemeRole =
  | "heading"
  | "accent"
  | "value"
  | "muted"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "prompt";

/** One format `styleText` understands. */
export type ThemeFormat = Exclude<Parameters<typeof styleText>[0], unknown[]>;

/**
 * What each role looks like, and the only place that knows it.
 *
 * Terminals do not reliably report whether they are light or dark, so the
 * palette assumes dark and uses the bright half of the ANSI palette.
 */
export const ROLE_FORMATS = {
  heading: "bold",
  accent: "cyanBright",
  value: "whiteBright",
  muted: "gray",
  success: "greenBright",
  warning: "yellowBright",
  error: "redBright",
  info: "blueBright",
  prompt: "magentaBright",
} as const satisfies Record<ThemeRole, ThemeFormat>;

/** The highlighted option in a menu: bold green. */
export const SELECTION_FORMAT = ["bold", "greenBright"] as const;

/**
 * Styles the highlighted option of a menu.
 *
 * @param text The option's label.
 * @returns The styled label.
 */
export function paintSelection(text: string): string {
  return styleText([...SELECTION_FORMAT], text, { stream: process.stderr });
}

/**
 * Styles `text` as `role`.
 *
 * `styleText` checks stderr itself, so the text stays plain when stderr is
 * not a terminal or `NO_COLOR` is set.
 *
 * @param role What the text is.
 * @param text The text to style.
 * @returns The styled text.
 */
export function paint(role: ThemeRole, text: string): string {
  return styleText(ROLE_FORMATS[role], text, { stream: process.stderr });
}

/**
 * Writes one line of the conversation (progress, a warning, a failure) to
 * stderr. Data goes to stdout, and never through here.
 *
 * @param message The line to write.
 */
export function say(message: string): void {
  process.stderr.write(`${message}\n`);
}

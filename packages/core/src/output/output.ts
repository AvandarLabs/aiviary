import { paint, say } from "../theme/theme.ts";

/**
 * The conversation half of a command's output: progress, results, warnings,
 * and failures, all on stderr. Data goes to stdout and never through here.
 * See `docs/rules/cli-ux.md`.
 */
export const Output = {
  /** Announces work before it starts. */
  progress: (message: string): void => {
    say(paint("muted", `… ${message}`));
  },

  /** Reports a finished result. */
  success: (message: string): void => {
    say(paint("success", `✅ ${message}`));
  },

  /** Reports something that needs attention but did not fail. */
  warning: (message: string): void => {
    say(paint("warning", `⚠️ ${message}`));
  },

  /**
   * Reports a failure, and on the next line what to do about it.
   *
   * @param options The command that failed, what went wrong, and the fix.
   */
  error: (options: { command: string; message: string; fix: string }): void => {
    say(paint("error", `❌ ${options.command}: ${options.message}`));
    say(paint("warning", `  ⚠️ ${options.fix}`));
  },
};

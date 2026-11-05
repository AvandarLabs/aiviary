import { paint, say } from "./theme/theme.ts";

/**
 * Runs a command's action, turning a failure into one `error:` line on stderr
 * and a non-zero exit code instead of an unhandled rejection's stack trace.
 *
 * It sets `process.exitCode` rather than calling `process.exit`, so pending
 * output is flushed before the process ends.
 *
 * @param action The command's work.
 */
export async function runAction(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    say(`${paint("error", "error:")} ${message}`);
    process.exitCode = 1;
  }
}

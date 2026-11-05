import { isToolCallEventType } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Commands that publish work or rewrite shared history. */
const GUARDED_COMMAND_PATTERNS = [
  /\bgit\s+push\b/,
  /\bgh\s+pr\s+(create|merge)\b/,
  /\bgit\s+reset\s+--hard\b/,
] as const;

/**
 * Whether a shell command publishes work or rewrites shared history, which
 * Crow never does without the person's say-so.
 *
 * @param command The shell command the model wants to run.
 * @returns Whether it needs confirmation.
 */
export function isGuardedCommand(command: string): boolean {
  return GUARDED_COMMAND_PATTERNS.some((pattern) => {
    return pattern.test(command);
  });
}

/**
 * Asks before every push, pull-request creation or merge, and hard reset.
 * Without a UI to ask on (print mode), the command is blocked.
 */
export default function gitGuard(pi: ExtensionAPI): void {
  pi.on("tool_call", async (event, ctx) => {
    if (!isToolCallEventType("bash", event)) {
      return undefined;
    }
    const command = event.input.command;
    if (!isGuardedCommand(command)) {
      return undefined;
    }
    const isAllowed = ctx.hasUI
      ? await ctx.ui.confirm(
          "Crow wants to publish or rewrite history",
          `Allow this command?\n\n${command}`,
        )
      : false;
    return isAllowed
      ? undefined
      : { block: true, reason: "The person did not approve this command." };
  });
}

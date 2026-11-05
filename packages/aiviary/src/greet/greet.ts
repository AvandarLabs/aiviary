import { Acclimate } from "@avandar/acclimate";
import { askIfMissing } from "../prompt/prompt.ts";
import { runAction } from "../runAction.ts";

/**
 * Builds the greeting. It is pure, so the test needs no process.
 *
 * @param options The name to greet, and whether to shout it.
 * @returns The greeting, uppercased when shouting.
 */
export function buildGreeting(options: {
  name: string;
  shout: boolean;
}): string {
  const greeting = `Hello, ${options.name}!`;
  return options.shout ? greeting.toUpperCase() : greeting;
}

/**
 * `greet [name] [--shout]`: prints a greeting on stdout.
 *
 * The greeting is the command's data, so it is the only thing written to
 * stdout. A name left out is asked for on a terminal and is a failure naming
 * the argument everywhere else.
 */
export const GreetCli = Acclimate.createCLI("greet")
  .description(
    "Print a greeting. Asks for the name when it is left out on a terminal.",
  )
  .addPositionalArg({
    name: "name",
    type: "string",
    required: false,
    description: "Who to greet.",
  })
  .addOption({
    name: "--shout",
    type: "boolean",
    required: false,
    defaultValue: false,
    description: "Uppercase the greeting.",
  })
  .action(async ({ name, shout }) => {
    await runAction(async () => {
      const resolvedName = await askIfMissing({
        given: name,
        question: {
          subject: "name to greet",
          label: "Who should I greet?",
          flag: "the <name> argument",
        },
      });
      process.stdout.write(
        `${buildGreeting({ name: resolvedName, shout: shout ?? false })}\n`,
      );
    });
  });

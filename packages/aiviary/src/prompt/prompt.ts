import { createInterface } from "node:readline/promises";

/**
 * A value a command needs and was not given.
 *
 * See `docs/rules/cli-ux.md`: the same description serves the person who is
 * asked and the script that is told which flag it forgot.
 */
export type Question = {
  /** What is missing, as a noun phrase: "name to greet". */
  subject: string;
  /** What to ask a person: "Who should I greet?". */
  label: string;
  /** The flag or argument that answers it without being asked. */
  flag: string;
};

/**
 * The failure when there is nobody to ask: it names what is missing and the
 * flag that would have answered it.
 *
 * @param question The value that is missing.
 * @returns The message to fail with.
 */
export function buildUnanswerableMessage(question: Readonly<Question>): string {
  return `no ${question.subject} was given. Pass ${question.flag}.`;
}

/**
 * Returns the value the command line gave, or asks for it.
 *
 * It asks only when stdin is a terminal. Anywhere else (a pipe, a CI job, an
 * agent) it throws a message naming the flag instead of waiting for input
 * that will never arrive. The question is written to stderr, because stdout
 * carries only the command's data.
 *
 * @param options The value given, the question to ask without it, and
 *   whether there is somebody to ask (defaults to whether stdin is a TTY).
 * @returns The value, given or answered.
 */
export async function askIfMissing(options: {
  given: string | undefined;
  question: Readonly<Question>;
  isInteractive?: boolean;
}): Promise<string> {
  const {
    given,
    question,
    isInteractive = process.stdin.isTTY === true,
  } = options;
  if (given !== undefined && given !== "") {
    return given;
  }
  if (!isInteractive) {
    throw new Error(buildUnanswerableMessage(question));
  }

  const terminal = createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  try {
    const answer = (await terminal.question(`${question.label} `)).trim();
    if (answer === "") {
      throw new Error(buildUnanswerableMessage(question));
    }
    return answer;
  } finally {
    terminal.close();
  }
}

import { describe, expect, it } from "vitest";
import { askIfMissing, buildUnanswerableMessage } from "./prompt.ts";

const QUESTION = {
  subject: "name to greet",
  label: "Who should I greet?",
  flag: "--name",
};

describe("askIfMissing", () => {
  it("returns the value the command line gave without asking", async () => {
    await expect(
      askIfMissing({ given: "Ada", question: QUESTION, isInteractive: false }),
    ).resolves.toBe("Ada");
  });

  it("fails naming the flag when there is nobody to ask", async () => {
    await expect(
      askIfMissing({
        given: undefined,
        question: QUESTION,
        isInteractive: false,
      }),
    ).rejects.toThrow(buildUnanswerableMessage(QUESTION));
  });
});

describe("buildUnanswerableMessage", () => {
  it("names what is missing and the flag that answers it", () => {
    expect(buildUnanswerableMessage(QUESTION)).toBe(
      "no name to greet was given. Pass --name.",
    );
  });
});

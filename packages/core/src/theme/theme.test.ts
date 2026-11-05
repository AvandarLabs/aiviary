import { describe, expect, it } from "vitest";
import { ROLE_FORMATS } from "./theme.ts";

/** The formats that stay readable on a dark background. */
const READABLE_ON_DARK = new Set<string>([
  "bold",
  "gray",
  "redBright",
  "greenBright",
  "yellowBright",
  "blueBright",
  "magentaBright",
  "cyanBright",
  "whiteBright",
]);

describe("ROLE_FORMATS", () => {
  it("keeps every role readable on a dark terminal", () => {
    const unreadable = Object.entries(ROLE_FORMATS).filter(([, format]) => {
      return !READABLE_ON_DARK.has(format);
    });
    expect(unreadable).toEqual([]);
  });
});

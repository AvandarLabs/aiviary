import { describe, expect, it } from "vitest";
import { buildGreeting } from "./greet.ts";

describe("buildGreeting", () => {
  it("greets by name", () => {
    expect(buildGreeting({ name: "Ada", shout: false })).toBe("Hello, Ada!");
  });

  it("uppercases the greeting when shouting", () => {
    expect(buildGreeting({ name: "Ada", shout: true })).toBe("HELLO, ADA!");
  });
});

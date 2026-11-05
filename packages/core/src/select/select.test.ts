import { describe, expect, it } from "vitest";
import { keyToMenuKey, moveCursor, renderMenu } from "./select.ts";

describe("keyToMenuKey", () => {
  it("moves with the arrows and with j/k", () => {
    expect(keyToMenuKey({ name: "up" })).toBe("up");
    expect(keyToMenuKey({ name: "k", sequence: "k" })).toBe("up");
    expect(keyToMenuKey({ name: "down" })).toBe("down");
    expect(keyToMenuKey({ name: "j", sequence: "j" })).toBe("down");
  });

  it("jumps with g and G", () => {
    expect(keyToMenuKey({ name: "g", sequence: "g" })).toBe("first");
    expect(keyToMenuKey({ name: "g", sequence: "G" })).toBe("last");
  });

  it("confirms with Enter and cancels with Escape, q, or Ctrl-C", () => {
    expect(keyToMenuKey({ name: "return" })).toBe("confirm");
    expect(keyToMenuKey({ name: "escape" })).toBe("cancel");
    expect(keyToMenuKey({ name: "q", sequence: "q" })).toBe("cancel");
    expect(keyToMenuKey({ name: "c", ctrl: true })).toBe("cancel");
  });
});

describe("moveCursor", () => {
  it("wraps between the first and last option", () => {
    expect(moveCursor({ index: 0, count: 3, key: "up" })).toBe(2);
    expect(moveCursor({ index: 2, count: 3, key: "down" })).toBe(0);
    expect(moveCursor({ index: 1, count: 3, key: "last" })).toBe(2);
    expect(moveCursor({ index: 2, count: 3, key: "first" })).toBe(0);
    expect(moveCursor({ index: 1, count: 3, key: "other" })).toBe(1);
  });
});

describe("renderMenu", () => {
  it("marks the current option with a cursor", () => {
    const lines = renderMenu({ title: "Which?", labels: ["a", "b"], index: 1 });
    expect(lines[1]).toBe("  a");
    expect(lines[2]).toContain("❯ b");
  });
});

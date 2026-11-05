import { describe, expect, it } from "vitest";
import { isGuardedCommand } from "./git-guard.ts";

describe("isGuardedCommand", () => {
  it("guards pushes, pull requests, merges, and hard resets", () => {
    expect(isGuardedCommand("git push origin feat/x")).toBe(true);
    expect(isGuardedCommand("gh pr create --fill")).toBe(true);
    expect(isGuardedCommand("gh pr merge 12")).toBe(true);
    expect(isGuardedCommand("git reset --hard HEAD~1")).toBe(true);
  });

  it("lets everyday commands through", () => {
    expect(isGuardedCommand("git status")).toBe(false);
    expect(isGuardedCommand("git commit -m 'feat: x'")).toBe(false);
    expect(isGuardedCommand("gh pr view 12")).toBe(false);
  });
});

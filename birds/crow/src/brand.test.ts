import { findBrandProblems, renderHeader } from "@aiviary/core";
import { describe, expect, it } from "vitest";
import { CROW_BRAND } from "./brand.ts";

describe("CROW_BRAND", () => {
  it("is a complete brand", () => {
    expect(findBrandProblems(CROW_BRAND)).toEqual([]);
  });

  it("shows its picture beside its name on a normal terminal", () => {
    const roles = renderHeader({
      brand: CROW_BRAND,
      width: 100,
      details: "",
    }).flatMap((line) => {
      return line.map((segment) => {
        return segment.role;
      });
    });
    expect(roles).toContain("art");
    expect(roles).toContain("banner");
  });
});

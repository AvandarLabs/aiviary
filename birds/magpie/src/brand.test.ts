import { findBrandProblems, renderHeader } from "@avandar/aiviary-core";
import { describe, expect, it } from "vitest";
import { MAGPIE_BRAND } from "./brand.ts";

describe("MAGPIE_BRAND", () => {
  it("is a complete brand", () => {
    expect(findBrandProblems(MAGPIE_BRAND)).toEqual([]);
  });

  it("shows its picture beside its name on a normal terminal", () => {
    const roles = renderHeader({
      brand: MAGPIE_BRAND,
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

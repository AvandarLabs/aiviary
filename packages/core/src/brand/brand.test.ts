import { describe, expect, it } from "vitest";
import {
  brandFromEnvValue,
  brandToEnvValue,
  findBrandProblems,
} from "./brand.ts";
import type { BirdBrand } from "./brand.ts";

const BRAND: BirdBrand = {
  name: "wren",
  displayName: "Wren",
  tagline: "A small test bird.",
  art: ["(o>"],
  banner: ["WREN"],
  palette: { accent: "#ffcc00", secondary: "#00ccff" },
  workingMessage: "Hopping...",
};

describe("findBrandProblems", () => {
  it("accepts a complete brand", () => {
    expect(findBrandProblems(BRAND)).toEqual([]);
  });

  it("reports every problem at once", () => {
    const problems = findBrandProblems({
      ...BRAND,
      name: "Wren Bird",
      tagline: " ",
      art: [],
    });
    expect(problems).toHaveLength(3);
  });
});

describe("brandFromEnvValue", () => {
  it("round-trips a brand through the environment", () => {
    expect(brandFromEnvValue(brandToEnvValue(BRAND))).toEqual(BRAND);
  });

  it("ignores a missing, malformed, or invalid value", () => {
    expect(brandFromEnvValue(undefined)).toBeUndefined();
    expect(brandFromEnvValue("{not json")).toBeUndefined();
    expect(
      brandFromEnvValue(brandToEnvValue({ ...BRAND, art: [] })),
    ).toBeUndefined();
  });
});

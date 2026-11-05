import { describe, expect, it } from "vitest";
import type { BirdBrand } from "../brand/brand.ts";
import { buildPiTheme } from "./piTheme.ts";

const BRAND: BirdBrand = {
  name: "wren",
  displayName: "Wren",
  tagline: "A small test bird.",
  art: ["(o>"],
  banner: ["WREN"],
  palette: { accent: "#ffcc00", secondary: "#00ccff" },
  workingMessage: "Hopping...",
};

describe("buildPiTheme", () => {
  it("is named after the bird and uses its colors", () => {
    const theme = buildPiTheme(BRAND);
    expect(theme.name).toBe("wren");
    expect(theme.vars["birdAccent"]).toBe("#ffcc00");
    expect(theme.vars["birdSecondary"]).toBe("#00ccff");
    expect(theme.colors["accent"]).toBe("birdAccent");
  });

  it("points every color at a defined variable or a literal color", () => {
    const theme = buildPiTheme(BRAND);
    const undefinedVariables = Object.values(theme.colors).filter((value) => {
      const isLiteral = /^(#|okhsl\(|oklch\(|$)/.test(value);
      return !isLiteral && theme.vars[value] === undefined;
    });
    expect(undefinedVariables).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import type { BirdBrand } from "../brand/brand.ts";
import { renderHeader } from "./header.ts";
import type { HeaderSegment } from "./header.ts";

const BRAND: BirdBrand = {
  name: "wren",
  displayName: "Wren",
  tagline: "A small test bird.",
  art: ["(o>", "/)", "^^"],
  banner: ["WWW", "REN"],
  palette: { accent: "#ffcc00", secondary: "#00ccff" },
  workingMessage: "Hopping...",
};

function _text(line: readonly HeaderSegment[]): string {
  return line
    .map((segment) => {
      return segment.text;
    })
    .join("");
}

function _roles(lines: readonly HeaderSegment[][]): Set<string> {
  return new Set(
    lines.flatMap((line) => {
      return line.map((segment) => {
        return segment.role;
      });
    }),
  );
}

describe("renderHeader", () => {
  it("puts the picture beside the banner when both fit", () => {
    const lines = renderHeader({ brand: BRAND, width: 40, details: "v1" });
    expect(_text(lines[1]!)).toBe(" (o>   WWW");
    expect(_text(lines[2]!)).toBe(" /)    REN");
    expect(_text(lines[3]!).trimEnd()).toBe(" ^^");
    expect(_roles(lines)).toContain("art");
  });

  it("drops the picture when only the banner fits", () => {
    const lines = renderHeader({ brand: BRAND, width: 6, details: "v1" });
    expect(_roles(lines)).not.toContain("art");
    expect(_roles(lines)).toContain("banner");
  });

  it("falls back to the plain name on a very narrow terminal", () => {
    const lines = renderHeader({ brand: BRAND, width: 3, details: "v1" });
    expect(_roles(lines)).toContain("title");
    expect(_roles(lines)).not.toContain("banner");
  });

  it("never draws past the terminal's width", () => {
    renderHeader({ brand: BRAND, width: 12, details: "x".repeat(50) }).forEach(
      (line) => {
        expect([..._text(line)].length).toBeLessThanOrEqual(12);
      },
    );
  });

  it("shows the tagline and the details", () => {
    const text = renderHeader({ brand: BRAND, width: 40, details: "v1 · ~" })
      .map(_text)
      .join("\n");
    expect(text).toContain("A small test bird.");
    expect(text).toContain("v1 · ~");
  });
});

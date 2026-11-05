import { describe, expect, it } from "vitest";
import type { BirdBrand } from "../brand/brand.ts";
import { buildBirdHelp, parseBirdRequest } from "./runBird.ts";

const BRAND: BirdBrand = {
  name: "wren",
  displayName: "Wren",
  tagline: "A small test bird.",
  art: ["(o>"],
  banner: ["WREN"],
  palette: { accent: "#ffcc00", secondary: "#00ccff" },
  workingMessage: "Hopping...",
};

describe("parseBirdRequest", () => {
  it("launches pi when there is nothing special to do", () => {
    expect(parseBirdRequest([])).toBe("launch");
    expect(parseBirdRequest(["-c", "--model", "opus"])).toBe("launch");
  });

  it("lets help win over every other argument", () => {
    expect(parseBirdRequest(["--model", "opus", "-h"])).toBe("help");
    expect(parseBirdRequest(["--pi-help", "--help"])).toBe("help");
  });

  it("ignores options that come after --, which pi reads as a message", () => {
    expect(parseBirdRequest(["--", "--help"])).toBe("launch");
  });

  it("answers the version only when it is the whole request", () => {
    expect(parseBirdRequest(["--version"])).toBe("version");
    expect(parseBirdRequest(["-v"])).toBe("version");
    expect(parseBirdRequest(["--pi-help"])).toBe("pi-help");
  });
});

describe("buildBirdHelp", () => {
  it("names the bird, its home variable, and worked examples", () => {
    const help = buildBirdHelp({
      brand: BRAND,
      packageDir: "/b",
      version: "1.0.0",
    });
    expect(help).toContain("Wren: A small test bird.");
    expect(help).toContain("wren [options]");
    expect(help).toContain("WREN_HOME");
    expect(help).toContain("~/.wren");
    expect(help).toContain("Examples:");
  });
});

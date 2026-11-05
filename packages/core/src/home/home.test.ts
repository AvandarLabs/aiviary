import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { BirdBrand } from "../brand/brand.ts";
import { prepareBirdHome } from "./home.ts";

const BRAND: BirdBrand = {
  name: "wren",
  displayName: "Wren",
  tagline: "A small test bird.",
  art: ["(o>"],
  banner: ["WREN"],
  palette: { accent: "#ffcc00", secondary: "#00ccff" },
  workingMessage: "Hopping...",
};

function _readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

describe("prepareBirdHome", () => {
  it("writes the theme and selects it in a fresh home", async () => {
    const birdHome = join(mkdtempSync(join(tmpdir(), "home-")), ".wren");

    const result = await prepareBirdHome({ brand: BRAND, birdHome });

    expect(result.isNewHome).toBe(true);
    expect(_readJson(join(birdHome, "agent/themes/wren.json"))["name"]).toBe(
      "wren",
    );
    expect(_readJson(join(birdHome, "agent/settings.json"))).toEqual({
      theme: "wren",
    });
  });

  it("keeps a theme the person chose and the rest of their settings", async () => {
    const birdHome = mkdtempSync(join(tmpdir(), "home-"));
    mkdirSync(join(birdHome, "agent"));
    writeFileSync(
      join(birdHome, "agent/settings.json"),
      JSON.stringify({ theme: "light", quietStartup: true }),
    );

    const result = await prepareBirdHome({ brand: BRAND, birdHome });

    expect(result.isNewHome).toBe(false);
    expect(_readJson(join(birdHome, "agent/settings.json"))).toEqual({
      theme: "light",
      quietStartup: true,
    });
  });
});

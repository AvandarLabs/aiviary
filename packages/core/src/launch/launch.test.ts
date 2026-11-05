import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { BirdBrand } from "../brand/brand.ts";
import { brandFromEnvValue } from "../brand/brand.ts";
import {
  BRANDING_EXTENSION_PATH,
  buildHomeEnvVarName,
  buildPiArgs,
  buildPiEnv,
  findBirdResources,
  resolveBirdHome,
  resolvePiPackage,
} from "./launch.ts";

const BRAND: BirdBrand = {
  name: "wren",
  displayName: "Wren",
  tagline: "A small test bird.",
  art: ["(o>"],
  banner: ["WREN"],
  palette: { accent: "#ffcc00", secondary: "#00ccff" },
  workingMessage: "Hopping...",
};

describe("resolveBirdHome", () => {
  it("defaults to a dot directory named after the bird", () => {
    expect(resolveBirdHome({ name: "wren", env: {}, userHome: "/u" })).toBe(
      "/u/.wren",
    );
  });

  it("honors the bird's own home variable", () => {
    expect(buildHomeEnvVarName("blue-jay")).toBe("BLUE_JAY_HOME");
    expect(
      resolveBirdHome({ name: "wren", env: { WREN_HOME: "/tmp/w" } }),
    ).toBe("/tmp/w");
  });
});

describe("findBirdResources", () => {
  it("finds only what the bird ships", () => {
    const packageDir = mkdtempSync(join(tmpdir(), "bird-"));
    mkdirSync(join(packageDir, "extensions"));
    writeFileSync(join(packageDir, "extensions", "b.ts"), "");
    writeFileSync(join(packageDir, "extensions", "a.ts"), "");
    writeFileSync(join(packageDir, "extensions", "a.test.ts"), "");
    writeFileSync(join(packageDir, "SYSTEM.md"), "");

    const resources = findBirdResources(packageDir);

    expect(resources.systemPromptPath).toBe(join(packageDir, "SYSTEM.md"));
    expect(resources.extensionPaths).toEqual([
      join(packageDir, "extensions", "a.ts"),
      join(packageDir, "extensions", "b.ts"),
    ]);
    expect(resources.skillsDir).toBeUndefined();
    expect(resources.promptsDir).toBeUndefined();
  });
});

describe("buildPiArgs", () => {
  it("loads branding first, then the bird's resources, then the user's args", () => {
    const args = buildPiArgs({
      resources: {
        systemPromptPath: "/b/SYSTEM.md",
        extensionPaths: ["/b/extensions/guard.ts"],
        skillsDir: "/b/skills",
        promptsDir: undefined,
      },
      userArgs: ["--model", "opus", "fix the bug"],
    });
    expect(args).toEqual([
      "--extension",
      BRANDING_EXTENSION_PATH,
      "--extension",
      "/b/extensions/guard.ts",
      "--append-system-prompt",
      "/b/SYSTEM.md",
      "--skill",
      "/b/skills",
      "--model",
      "opus",
      "fix the bug",
    ]);
  });
});

describe("buildPiEnv", () => {
  it("points pi at the bird's home and hands it the brand", () => {
    const env = buildPiEnv({
      bird: { brand: BRAND, packageDir: "/b", version: "1.2.3" },
      birdHome: "/u/.wren",
      env: { PATH: "/bin" },
    });
    expect(env["PATH"]).toBe("/bin");
    expect(env["PI_CODING_AGENT_DIR"]).toBe("/u/.wren/agent");
    expect(env["PI_SKIP_VERSION_CHECK"]).toBe("1");
    expect(env["AIVIARY_BIRD_VERSION"]).toBe("1.2.3");
    expect(brandFromEnvValue(env["AIVIARY_BRAND"])).toEqual(BRAND);
  });
});

describe("resolvePiPackage", () => {
  it("finds the pi this package depends on", () => {
    const pi = resolvePiPackage();
    expect(pi.cliPath).toMatch(/pi-coding-agent.*cli\.js$/);
    expect(pi.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

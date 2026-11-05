import {
  lstatSync,
  mkdtempSync,
  readlinkSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildSetupHelp,
  parseSetupArgs,
  readLinkState,
  runBirdSetup,
} from "./setup.ts";

function _sandbox(): { entryPath: string; binDir: string } {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "setup-")));
  const entryPath = join(root, "main.ts");
  writeFileSync(entryPath, "#!/usr/bin/env node\n");
  return { entryPath, binDir: join(root, "bin") };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parseSetupArgs", () => {
  it("reads the action, the bird, and the bin directory", () => {
    expect(parseSetupArgs(["link", "crow", "--bin-dir", "/b"])).toEqual({
      action: "link",
      bird: "crow",
      binDir: "/b",
      isHelp: false,
    });
  });

  it("lets help win", () => {
    expect(parseSetupArgs(["link", "-h"])).toMatchObject({ isHelp: true });
    expect(parseSetupArgs(["bogus", "--help"])).toMatchObject({ isHelp: true });
  });

  it("rejects an unknown command, an extra argument, or an unknown option", () => {
    expect(parseSetupArgs(["fly"])).toHaveProperty("error");
    expect(parseSetupArgs(["link", "crow", "magpie"])).toHaveProperty("error");
    expect(parseSetupArgs(["list", "crow"])).toHaveProperty("error");
    expect(parseSetupArgs(["link", "--fast"])).toHaveProperty("error");
  });
});

describe("buildSetupHelp", () => {
  it("documents every command, the birds, and examples", () => {
    const help = buildSetupHelp({
      command: "pnpm birds",
      birds: [{ name: "crow", entryPath: "/c" }],
    });
    [
      "link [bird]",
      "unlink [bird]",
      "list",
      "--bin-dir",
      "crow",
      "Examples:",
    ].forEach((text) => {
      expect(help).toContain(text);
    });
  });
});

describe("readLinkState", () => {
  it("tells this tool's link from a missing or foreign one", () => {
    const { entryPath, binDir } = _sandbox();
    const linkPath = join(binDir, "..", "crow");
    expect(readLinkState({ linkPath, entryPath })).toBe("not linked");
    symlinkSync(entryPath, linkPath);
    expect(readLinkState({ linkPath, entryPath })).toBe("linked");
    expect(readLinkState({ linkPath, entryPath: "/elsewhere" })).toBe(
      "blocked",
    );
  });
});

describe("runBirdSetup", () => {
  it("links and unlinks a bird without asking anything", async () => {
    vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const { entryPath, binDir } = _sandbox();
    const birds = [{ name: "crow", entryPath }];
    const linkPath = join(binDir, "crow");

    const linked = await runBirdSetup({
      command: "birds",
      birds,
      argv: ["link", "crow", "--bin-dir", binDir],
    });
    expect(linked).toBe(0);
    expect(readlinkSync(linkPath)).toBe(entryPath);
    expect(lstatSync(entryPath).mode & 0o111).not.toBe(0);

    const unlinked = await runBirdSetup({
      command: "birds",
      birds,
      argv: ["unlink", "crow", "--bin-dir", binDir],
    });
    expect(unlinked).toBe(0);
    expect(readLinkState({ linkPath, entryPath })).toBe("not linked");
  });

  it("refuses to replace a file it did not create", async () => {
    vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const { entryPath, binDir } = _sandbox();
    await runBirdSetup({
      command: "birds",
      birds: [{ name: "crow", entryPath }],
      argv: ["link", "crow", "--bin-dir", binDir],
    });

    const code = await runBirdSetup({
      command: "birds",
      birds: [{ name: "crow", entryPath: join(binDir, "..", "other.ts") }],
      argv: ["link", "crow", "--bin-dir", binDir],
    });

    expect(code).toBe(1);
    expect(readlinkSync(join(binDir, "crow"))).toBe(entryPath);
  });

  it("fails naming the bird to pass when nobody can be asked", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const code = await runBirdSetup({
      command: "birds",
      birds: [{ name: "crow", entryPath: "/c" }],
      argv: ["link"],
    });
    expect(code).toBe(2);
    expect(stderr.mock.calls.join("")).toContain("birds link crow");
  });

  it("lists each bird's state on stdout", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const { entryPath, binDir } = _sandbox();
    const code = await runBirdSetup({
      command: "birds",
      birds: [{ name: "crow", entryPath }],
      argv: ["list", "--bin-dir", binDir],
    });
    expect(code).toBe(0);
    expect(stdout.mock.calls.join("")).toBe(
      `crow\tnot linked\t${join(binDir, "crow")}\n`,
    );
  });
});

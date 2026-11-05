import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { BirdBrand } from "../brand/brand.ts";
import { buildPiTheme } from "../piTheme/piTheme.ts";

/**
 * Which skills a bird loads, besides the ones in its own package.
 *
 * - `everything`: pi's default discovery, including every skill installed
 *   machine-wide in `~/.agents/skills`.
 * - `own-and-project`: the bird's own skills (its package's `skills/` and its
 *   home's `agent/skills`) and the current project's, which pi loads only
 *   once the project is trusted. The machine-wide `~/.agents/skills` is left
 *   out, so personal skills never reach a bird meant for other work.
 */
export type BirdSkillPolicy = "everything" | "own-and-project";

/** pi's settings, as far as the bird's home preparation reads them. */
type PiSettings = Record<string, unknown>;

/**
 * Prepares a bird's home before pi starts in it.
 *
 * It writes the bird's theme where pi discovers themes
 * (`agent/themes/<name>.json`), every time, because the theme is generated
 * from the brand and must follow it. On a fresh home it also selects that
 * theme in pi's settings; a person who later picks another theme in
 * `/settings` keeps it. And it applies the bird's skill policy, every time,
 * because the policy belongs to the bird, not to the person's settings.
 *
 * @param options The bird's brand, home, skill policy, and the user's home.
 * @returns Whether the home was created by this call.
 */
export async function prepareBirdHome(options: {
  brand: Readonly<BirdBrand>;
  birdHome: string;
  skillPolicy?: BirdSkillPolicy;
  userHome?: string;
}): Promise<{ isNewHome: boolean }> {
  const {
    brand,
    birdHome,
    skillPolicy = "everything",
    userHome = homedir(),
  } = options;
  const agentDir = join(birdHome, "agent");
  const themesDir = join(agentDir, "themes");
  const isNewHome = !existsSync(agentDir);
  await mkdir(themesDir, { recursive: true });
  await writeFile(
    join(themesDir, `${brand.name}.json`),
    `${JSON.stringify(buildPiTheme(brand), undefined, 2)}\n`,
  );

  const settingsPath = join(agentDir, "settings.json");
  const original = existsSync(settingsPath)
    ? (JSON.parse(await readFile(settingsPath, "utf8")) as PiSettings)
    : {};
  const withTheme =
    original["theme"] === undefined
      ? { ...original, theme: brand.name }
      : original;
  const settings = applySkillPolicy({
    settings: withTheme,
    policy: skillPolicy,
    userHome,
  });
  if (JSON.stringify(settings) !== JSON.stringify(original)) {
    await writeFile(
      settingsPath,
      `${JSON.stringify(settings, undefined, 2)}\n`,
    );
  }
  return { isNewHome };
}

/**
 * Applies a skill policy to pi's settings.
 *
 * pi filters the skills it discovers through the `skills` setting's
 * exclusion patterns, and an absolute pattern matches only the machine-wide
 * `~/.agents/skills`: not the bird's own skills, and not a project's
 * `.agents/skills`. The bird owns exactly that one entry; every other entry is
 * the person's and is kept.
 *
 * @param options The current settings, the policy, and the user's home.
 * @returns The settings with the policy applied.
 */
export function applySkillPolicy(options: {
  settings: Readonly<PiSettings>;
  policy: BirdSkillPolicy;
  userHome: string;
}): PiSettings {
  const { settings, policy, userHome } = options;
  const exclusion = `!${join(userHome, ".agents", "skills")}/**`;
  const current = Array.isArray(settings["skills"])
    ? (settings["skills"] as unknown[])
    : undefined;
  if (policy === "own-and-project") {
    const skills = current ?? [];
    return skills.includes(exclusion)
      ? { ...settings }
      : { ...settings, skills: [...skills, exclusion] };
  }
  if (current === undefined || !current.includes(exclusion)) {
    return { ...settings };
  }
  return {
    ...settings,
    skills: current.filter((entry) => {
      return entry !== exclusion;
    }),
  };
}

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BirdBrand } from "../brand/brand.ts";
import { buildPiTheme } from "../piTheme/piTheme.ts";

/**
 * Prepares a bird's home before pi starts in it.
 *
 * It writes the bird's theme where pi discovers themes
 * (`agent/themes/<name>.json`), every time, because the theme is generated
 * from the brand and must follow it. On a fresh home it also selects that
 * theme in pi's settings. A person who later picks another theme in
 * `/settings` keeps it.
 *
 * @param options The bird's brand and home directory.
 * @returns Whether the home was created by this call.
 */
export async function prepareBirdHome(options: {
  brand: Readonly<BirdBrand>;
  birdHome: string;
}): Promise<{ isNewHome: boolean }> {
  const { brand, birdHome } = options;
  const agentDir = join(birdHome, "agent");
  const themesDir = join(agentDir, "themes");
  const isNewHome = !existsSync(agentDir);
  await mkdir(themesDir, { recursive: true });
  await writeFile(
    join(themesDir, `${brand.name}.json`),
    `${JSON.stringify(buildPiTheme(brand), undefined, 2)}\n`,
  );
  await _selectThemeUnlessChosen(join(agentDir, "settings.json"), brand.name);
  return { isNewHome };
}

/** Sets pi's `theme` setting to `themeName` when nobody has chosen one. */
async function _selectThemeUnlessChosen(
  settingsPath: string,
  themeName: string,
): Promise<void> {
  const settings = existsSync(settingsPath)
    ? (JSON.parse(await readFile(settingsPath, "utf8")) as Record<
        string,
        unknown
      >)
    : {};
  if (settings["theme"] !== undefined) {
    return;
  }
  settings["theme"] = themeName;
  await writeFile(settingsPath, `${JSON.stringify(settings, undefined, 2)}\n`);
}

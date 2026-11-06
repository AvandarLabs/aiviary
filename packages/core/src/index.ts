/**
 * `@avandar/aiviary-core`: what every bird shares.
 *
 * A bird is a branded harness around the pi coding agent: its own command,
 * home directory, theme, header, system prompt, extensions, and skills. A
 * bird's package calls `runBird` from its entry point and `runBirdSetup` from
 * its setup script; everything else here is what those two are built from.
 */
export type { BirdBrand, BirdPalette } from "./brand/brand.ts";
export { findBrandProblems } from "./brand/brand.ts";
export type { BirdDefinition } from "./launch/launch.ts";
export type { BirdSkillPolicy } from "./home/home.ts";
export { resolveBirdHome } from "./launch/launch.ts";
export { buildPiTheme } from "./piTheme/piTheme.ts";
export { renderHeader } from "./header/header.ts";
export { runBird } from "./runBird/runBird.ts";
export type { SetupBird } from "./setup/setup.ts";
export { runBirdSetup } from "./setup/setup.ts";

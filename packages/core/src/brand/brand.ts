/**
 * The colors a bird brings to its terminal UI. Each is any color pi's theme
 * format accepts, such as `"#2bb5c8"` or `"okhsl(190 60% 65%)"`.
 */
export type BirdPalette = {
  /** The bird's signature color: the logo, borders, and highlights. */
  accent: string;
  /** A second color for code spans and list bullets. */
  secondary: string;
};

/**
 * Everything that makes a bird look like its own program rather than pi.
 */
export type BirdBrand = {
  /** The command name, and the name of its home directory: `"crow"`. */
  name: string;
  /** How the bird is named in prose and titles: `"Crow"`. */
  displayName: string;
  /** One line saying what the bird is for. */
  tagline: string;
  /** A picture of the bird, one string per line. */
  art: string[];
  /** The bird's name in block letters, one string per line. */
  banner: string[];
  /** The bird's colors. */
  palette: BirdPalette;
  /** What the status line says while the model works. */
  workingMessage: string;
};

/** The environment variable the launcher hands the brand to pi through. */
export const BRAND_ENV_VAR_NAME = "AIVIARY_BRAND";

/** A command name a person can type: lowercase letters, digits, hyphens. */
const COMMAND_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * Every problem with a brand, so a bird's test can fail with all of them at
 * once. An empty list means the brand is usable.
 *
 * @param brand The brand to check.
 * @returns A description of each problem.
 */
export function findBrandProblems(brand: Readonly<BirdBrand>): string[] {
  const problems: string[] = [];
  if (!COMMAND_NAME_PATTERN.test(brand.name)) {
    problems.push(`name "${brand.name}" is not a lowercase command name`);
  }
  if (brand.displayName.trim() === "") {
    problems.push("displayName is empty");
  }
  if (brand.tagline.trim() === "") {
    problems.push("tagline is empty");
  }
  if (brand.art.length === 0) {
    problems.push("art has no lines");
  }
  if (brand.banner.length === 0) {
    problems.push("banner has no lines");
  }
  return problems;
}

/**
 * Serializes a brand for the environment variable pi's extension reads.
 *
 * @param brand The brand to pass on.
 * @returns The brand as JSON.
 */
export function brandToEnvValue(brand: Readonly<BirdBrand>): string {
  return JSON.stringify(brand);
}

/**
 * Reads the brand the launcher passed, or `undefined` when there is none (pi
 * was started some other way) or it cannot be read.
 *
 * @param value The environment variable's value.
 * @returns The brand, if there is a usable one.
 */
export function brandFromEnvValue(
  value: string | undefined,
): BirdBrand | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  try {
    const brand = JSON.parse(value) as BirdBrand;
    return findBrandProblems(brand).length === 0 ? brand : undefined;
  } catch {
    return undefined;
  }
}

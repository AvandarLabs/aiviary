import type { BirdBrand } from "../brand/brand.ts";

/**
 * A pi theme, as the JSON pi reads from `<agent dir>/themes/<name>.json`.
 * See pi's `docs/themes.md` for the format.
 */
export type PiTheme = {
  $schema: string;
  name: string;
  appearance: "dark" | "light";
  vars: Record<string, string>;
  colors: Record<string, string>;
  export: Record<string, string>;
};

/**
 * pi's built-in dark theme (pi 1.5.0), with every role that carries the
 * product's identity pointed at two variables a bird fills in: `birdAccent`
 * (borders, highlights, bullets) and `birdSecondary` (code spans, types).
 */
const BASE_VARS: Record<string, string> = {
  text: "okhsl(234 3% 89%)",
  muted: "okhsl(229 6% 67%)",
  violet: "okhsl(295 50% 67%)",
  blue: "okhsl(232 54% 67%)",
  green: "okhsl(159 59% 67%)",
  red: "okhsl(20 72% 67%)",
  yellow: "okhsl(83 88% 67%)",
  blueBg: "okhsl(233 41% 24%)",
};

const BASE_COLORS: Record<string, string> = {
  accent: "birdAccent",
  border: "birdAccent",
  borderAccent: "birdAccent",
  borderMuted: "okhsl(229 8% 53%)",
  success: "green",
  error: "red",
  warning: "yellow",
  muted: "muted",
  dim: "okhsl(229 8% 56%)",
  text: "text",
  thinkingText: "okhsl(226 7% 65%)",
  selectedBg: "blueBg",
  scrollbarTrack: "okhsl(237 7% 33%)",
  scrollbarThumb: "okhsl(232 7% 65%)",
  searchMatchBg: "okhsl(53 51% 24%)",
  searchMatchText: "muted",
  userMessageBg: "blueBg",
  userMessageText: "text",
  customMessageBg: "okhsl(295 42% 24%)",
  customMessageText: "muted",
  customMessageLabel: "birdAccent",
  toolPendingBg: "okhsl(229 5% 24%)",
  toolSuccessBg: "okhsl(158 46% 25%)",
  toolErrorBg: "okhsl(19 54% 25%)",
  toolTitle: "text",
  toolOutput: "muted",
  mdHeading: "yellow",
  mdLink: "blue",
  mdLinkUrl: "muted",
  mdCode: "birdSecondary",
  mdCodeBlock: "green",
  mdCodeBlockBorder: "muted",
  mdQuote: "muted",
  mdQuoteBorder: "muted",
  mdHr: "muted",
  mdListBullet: "birdAccent",
  toolDiffAdded: "green",
  toolDiffRemoved: "red",
  toolDiffContext: "muted",
  syntaxComment: "muted",
  syntaxKeyword: "blue",
  syntaxFunction: "yellow",
  syntaxVariable: "okhsl(202 58% 67%)",
  syntaxString: "okhsl(52 67% 67%)",
  syntaxNumber: "green",
  syntaxType: "birdSecondary",
  syntaxOperator: "muted",
  syntaxPunctuation: "muted",
  thinkingOff: "okhsl(229 8% 49%)",
  thinkingMinimal: "okhsl(232 20% 52%)",
  thinkingLow: "okhsl(232 45% 54%)",
  thinkingMedium: "okhsl(263 59% 56%)",
  thinkingHigh: "okhsl(295 73% 59%)",
  thinkingXhigh: "okhsl(337 81% 61%)",
  thinkingMax: "okhsl(20 99% 63%)",
  bashMode: "okhsl(159 64% 65%)",
};

const BASE_EXPORT: Record<string, string> = {
  pageBg: "okhsl(262 14% 16%)",
  cardBg: "okhsl(264 13% 19%)",
  infoBg: "okhsl(53 51% 24%)",
};

/**
 * Builds the bird's pi theme: pi's dark theme in the bird's colors. The theme
 * is named after the bird, so it is what `/settings` shows.
 *
 * @param brand The bird whose colors to use.
 * @returns The theme, ready to write as JSON.
 */
export function buildPiTheme(brand: Readonly<BirdBrand>): PiTheme {
  return {
    $schema: "https://pi.dev/schemas/theme.schema.json",
    name: brand.name,
    appearance: "dark",
    vars: {
      ...BASE_VARS,
      birdAccent: brand.palette.accent,
      birdSecondary: brand.palette.secondary,
    },
    colors: { ...BASE_COLORS },
    export: { ...BASE_EXPORT },
  };
}

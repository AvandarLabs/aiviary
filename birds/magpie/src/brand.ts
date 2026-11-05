import type { BirdBrand } from "@aiviary/core";

/** How Magpie looks: its picture, its name, and its colors. */
export const MAGPIE_BRAND: BirdBrand = {
  name: "magpie",
  displayName: "Magpie",
  tagline: "A personal agent for prototypes, experiments, and shiny ideas.",
  art: [
    "     __          *",
    "   _( o)>    *",
    "  /  _/  *",
    " /__/\\_________",
    "      \\\\",
    "      ^^",
  ],
  banner: [
    "███╗   ███╗ █████╗  ██████╗ ██████╗ ██╗███████╗",
    "████╗ ████║██╔══██╗██╔════╝ ██╔══██╗██║██╔════╝",
    "██╔████╔██║███████║██║  ███╗██████╔╝██║█████╗",
    "██║╚██╔╝██║██╔══██║██║   ██║██╔═══╝ ██║██╔══╝",
    "██║ ╚═╝ ██║██║  ██║╚██████╔╝██║     ██║███████╗",
    "╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝",
  ],
  palette: {
    accent: "okhsl(78 90% 70%)",
    secondary: "okhsl(320 65% 72%)",
  },
  workingMessage: "Collecting something shiny...",
};

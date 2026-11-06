import type { BirdBrand } from "@avandar/aiviary-core";

/** How Crow looks: its picture, its name, and its colors. */
export const CROW_BRAND: BirdBrand = {
  name: "crow",
  displayName: "Crow",
  tagline: "Avandar's problem-solving agent for production-quality code.",
  art: [
    "      ___",
    "    _/ o \\__",
    "   /  _____>",
    "  /  /\\",
    " /__/ /|",
    "=====//====",
  ],
  banner: [
    " ██████╗██████╗  ██████╗ ██╗    ██╗",
    "██╔════╝██╔══██╗██╔═══██╗██║    ██║",
    "██║     ██████╔╝██║   ██║██║ █╗ ██║",
    "██║     ██╔══██╗██║   ██║██║███╗██║",
    "╚██████╗██║  ██║╚██████╔╝╚███╔███╔╝",
    " ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝",
  ],
  palette: {
    accent: "okhsl(195 70% 66%)",
    secondary: "okhsl(270 55% 70%)",
  },
  workingMessage: "Solving the puzzle...",
};

import { homedir } from "node:os";
import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { BRAND_ENV_VAR_NAME, brandFromEnvValue } from "../src/brand/brand.ts";
import { renderHeader } from "../src/header/header.ts";
import type { HeaderRole } from "../src/header/header.ts";

/** The pi theme color each part of the header is drawn in. */
const ROLE_COLORS = {
  art: "accent",
  artHighlight: "text",
  banner: "accent",
  title: "accent",
  tagline: "text",
  detail: "dim",
} as const satisfies Record<HeaderRole, string>;

/** How long after pi's own title update to set the bird's title again. */
const TITLE_REASSERT_DELAY_MS = 250;

/**
 * Makes pi look like the bird that launched it: the bird's picture and name
 * as the startup header, its name as the terminal title, and its own message
 * while the model works.
 *
 * The launcher passes the brand in `AIVIARY_BRAND`. Without it (pi started
 * some other way) the extension does nothing, so plain pi is never rebranded.
 */
export default function branding(pi: ExtensionAPI): void {
  const brand = brandFromEnvValue(process.env[BRAND_ENV_VAR_NAME]);
  if (brand === undefined) {
    return;
  }
  const version = process.env["AIVIARY_BIRD_VERSION"] ?? "";
  let title = brand.displayName;

  // pi writes its own "π - <dir>" title when it finishes starting up and when
  // the session's name changes, after extensions have run. Setting the
  // bird's title again just after those moments keeps it.
  const reassertTitle = (ctx: ExtensionContext): void => {
    if (!ctx.hasUI) {
      return;
    }
    ctx.ui.setTitle(title);
    setTimeout(() => {
      ctx.ui.setTitle(title);
    }, TITLE_REASSERT_DELAY_MS);
  };
  pi.on("session_info_changed", (_event, ctx) => {
    reassertTitle(ctx);
  });
  pi.on("agent_start", (_event, ctx) => {
    reassertTitle(ctx);
  });

  pi.on("session_start", (_event, ctx) => {
    if (!ctx.hasUI) {
      return;
    }
    const home = homedir();
    const directory = ctx.cwd.startsWith(home)
      ? `~${ctx.cwd.slice(home.length)}`
      : ctx.cwd;
    const details = [version === "" ? "" : `v${version}`, directory]
      .filter((part) => {
        return part !== "";
      })
      .join(" · ");

    title = `${brand.displayName} · ${directory}`;
    reassertTitle(ctx);
    ctx.ui.setWorkingMessage(brand.workingMessage);
    ctx.ui.setHeader((_tui, theme) => {
      return {
        render: (width: number): string[] => {
          return renderHeader({ brand, width, details }).map((line) => {
            return line
              .map((segment) => {
                const colored = theme.fg(
                  ROLE_COLORS[segment.role],
                  segment.text,
                );
                return segment.role === "banner" || segment.role === "title"
                  ? theme.bold(colored)
                  : colored;
              })
              .join("");
          });
        },
        invalidate: () => {},
      };
    });
  });
}

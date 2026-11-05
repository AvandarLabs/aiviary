import type { BirdBrand } from "../brand/brand.ts";

/** What a piece of the header is, which decides its color. */
export type HeaderRole = "art" | "banner" | "title" | "tagline" | "detail";

/** A run of header text in one role. */
export type HeaderSegment = { text: string; role: HeaderRole };

/** The gap between the bird's picture and its name. */
const ART_GAP = "   ";

/** The indent before every header line. */
const INDENT = " ";

/**
 * Lays out the startup header: the bird's picture beside its name in block
 * letters, then its tagline and where it is running.
 *
 * It degrades with the terminal: the picture is dropped when both do not fit,
 * then the block letters, leaving the plain name. It is pure, so the layout is
 * tested without a terminal, and the caller only maps each role to a color.
 *
 * @param options The brand, the terminal width, and the details line.
 * @returns The header's lines, each a list of segments.
 */
export function renderHeader(options: {
  brand: Readonly<BirdBrand>;
  width: number;
  details: string;
}): HeaderSegment[][] {
  const { brand, width, details } = options;
  const contentWidth = Math.max(width - INDENT.length, 1);
  const lines = [
    [],
    ..._renderLogo(brand, contentWidth),
    [],
    [{ text: brand.tagline, role: "tagline" as const }],
    [{ text: details, role: "detail" as const }],
    [],
  ];
  return lines.map((line) => {
    return _fitLine(line, contentWidth);
  });
}

/** The widest line in `lines`. */
function _widthOf(lines: readonly string[]): number {
  return Math.max(
    0,
    ...lines.map((line) => {
      return [...line].length;
    }),
  );
}

/** The logo: picture and banner, banner alone, or the plain name. */
function _renderLogo(
  brand: Readonly<BirdBrand>,
  contentWidth: number,
): HeaderSegment[][] {
  const artWidth = _widthOf(brand.art);
  const bannerWidth = _widthOf(brand.banner);
  if (artWidth + ART_GAP.length + bannerWidth <= contentWidth) {
    return _sideBySide(brand.art, brand.banner, artWidth);
  }
  if (bannerWidth <= contentWidth) {
    return brand.banner.map((line) => {
      return [{ text: line, role: "banner" as const }];
    });
  }
  return [[{ text: brand.displayName, role: "title" }]];
}

/** The picture and the banner beside each other, centered vertically. */
function _sideBySide(
  art: readonly string[],
  banner: readonly string[],
  artWidth: number,
): HeaderSegment[][] {
  const height = Math.max(art.length, banner.length);
  const artTop = Math.floor((height - art.length) / 2);
  const bannerTop = Math.floor((height - banner.length) / 2);
  return Array.from({ length: height }, (_, row) => {
    const artLine = art[row - artTop] ?? "";
    const bannerLine = banner[row - bannerTop] ?? "";
    return [
      { text: artLine.padEnd(artWidth) + ART_GAP, role: "art" as const },
      { text: bannerLine, role: "banner" as const },
    ];
  });
}

/** Indents a line and cuts it at the terminal's width. */
function _fitLine(
  segments: readonly HeaderSegment[],
  contentWidth: number,
): HeaderSegment[] {
  let remaining = contentWidth;
  const fitted: HeaderSegment[] = [{ text: INDENT, role: "detail" }];
  segments.forEach((segment) => {
    const characters = [...segment.text].slice(0, Math.max(remaining, 0));
    remaining -= characters.length;
    fitted.push({ text: characters.join(""), role: segment.role });
  });
  const last = fitted[fitted.length - 1]!;
  if (fitted.length > 1 && last.text.trim() === "") {
    fitted.pop();
  }
  return fitted;
}

import { emitKeypressEvents } from "node:readline";
import { paint, paintSelection, say } from "../theme/theme.ts";

/** What a key press means in a menu. */
export type MenuKey =
  | "up"
  | "down"
  | "first"
  | "last"
  | "confirm"
  | "cancel"
  | "other";

/** The key name and sequence a terminal reports for one key press. */
export type KeyPress = { name?: string; sequence?: string; ctrl?: boolean };

/**
 * Maps a key press to its meaning: up/down or j/k move, g and G jump to the
 * first and last option, Enter confirms, and Escape, q, or Ctrl-C cancel.
 *
 * @param key The key press.
 * @returns What it means.
 */
export function keyToMenuKey(key: Readonly<KeyPress>): MenuKey {
  if (key.ctrl === true && key.name === "c") {
    return "cancel";
  }
  if (key.sequence === "G") {
    return "last";
  }
  switch (key.name) {
    case "up":
    case "k":
      return "up";
    case "down":
    case "j":
      return "down";
    case "g":
      return "first";
    case "return":
    case "enter":
      return "confirm";
    case "escape":
    case "q":
      return "cancel";
    default:
      return "other";
  }
}

/**
 * Moves the cursor for a key, wrapping between the first and last option.
 *
 * @param options The cursor, the number of options, and the key.
 * @returns The new cursor.
 */
export function moveCursor(options: {
  index: number;
  count: number;
  key: MenuKey;
}): number {
  const { index, count, key } = options;
  switch (key) {
    case "up":
      return (index - 1 + count) % count;
    case "down":
      return (index + 1) % count;
    case "first":
      return 0;
    case "last":
      return count - 1;
    default:
      return index;
  }
}

/**
 * Draws the menu: the question, then one line per option, the current one
 * marked with a cursor and drawn bold green.
 *
 * @param options The question, the option labels, and the cursor.
 * @returns The menu's lines.
 */
export function renderMenu(options: {
  title: string;
  labels: readonly string[];
  index: number;
}): string[] {
  const { title, labels, index } = options;
  return [
    paint("prompt", title),
    ...labels.map((label, position) => {
      return position === index ? paintSelection(`❯ ${label}`) : `  ${label}`;
    }),
    paint("muted", "↑/↓ or j/k to move, Enter to choose, Esc to cancel"),
  ];
}

/**
 * Asks the person to pick one option, on stderr.
 *
 * @param options The question and the option labels.
 * @returns The chosen option's position, or `undefined` when cancelled.
 */
export function selectOption(options: {
  title: string;
  labels: readonly string[];
}): Promise<number | undefined> {
  const { title, labels } = options;
  const input = process.stdin;
  let index = 0;
  let drawnLines = 0;
  const draw = (): void => {
    if (drawnLines > 0) {
      process.stderr.write(`\x1b[${drawnLines}A\x1b[0J`);
    }
    const lines = renderMenu({ title, labels, index });
    lines.forEach(say);
    drawnLines = lines.length;
  };

  return new Promise((resolvePromise) => {
    emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    const finish = (result: number | undefined): void => {
      input.off("keypress", onKeypress);
      input.setRawMode(false);
      input.pause();
      resolvePromise(result);
    };
    const onKeypress = (_text: string, key: KeyPress): void => {
      const menuKey = keyToMenuKey(key ?? {});
      if (menuKey === "cancel") {
        finish(undefined);
        return;
      }
      if (menuKey === "confirm") {
        finish(index);
        return;
      }
      index = moveCursor({ index, count: labels.length, key: menuKey });
      draw();
    };
    input.on("keypress", onKeypress);
    draw();
  });
}

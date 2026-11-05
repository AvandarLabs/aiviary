# TypeScript CLI rules

These rules say where [`cli-ux.md`](cli-ux.md) lives in this TypeScript code.
Read that file first: it holds the rules, and this one holds the mechanics.

## Arguments

aiviary has two kinds of command, and neither uses Acclimate, the default
for TypeScript CLIs elsewhere:

- **A bird** (`crow`, `magpie`) passes its arguments to pi untouched, so a
  person can use every pi option. `runBird` in `packages/core/src/runBird`
  intercepts only its own: `-h`/`--help` (the bird's help, which wins over
  everything before `--`), `-v`/`--version`, and `--pi-help`.
- **The setup tool** (`pnpm birds`) parses with `node:util` `parseArgs`.
  Acclimate 0.4 does not show help for a subcommand (`link -h` is read as a
  missing argument) and refuses an optional argument followed by an option
  with a value, and this tool has to support both.

Revisit Acclimate when it handles those. Until then, a new command follows
the setup tool's shape: a pure `parse...Args` that returns a request or an
error, a `build...Help` that is the one source of the help text, and a
`run...` that returns the exit code.

## Output

- Data goes to stdout with `process.stdout.write`. It is the only thing that
  does.
- Everything else goes to stderr through `Output` in
  `packages/core/src/output/output.ts`: `progress` before work starts,
  `success` (✅), `warning` (⚠️), and `error`, which prints `❌ command:
message` and an indented `⚠️` line saying how to fix it.
- Color goes through `paint(role, text)` in
  `packages/core/src/theme/theme.ts`, which owns the palette. It uses Node's
  `styleText`, which leaves the text plain when stderr is not a terminal or
  `NO_COLOR` is set.

## Asking for a missing value

- A choice from a fixed set is a menu: `selectOption` in
  `packages/core/src/select/select.ts`. It supports the arrows and `j`/`k`
  (wrapping), `g`/`G`, Enter, and Escape, `q`, or Ctrl-C to cancel, and draws
  the current option bold green behind a `❯` cursor.
- Free text is `askIfMissing` in `packages/core/src/prompt/prompt.ts`.
- Ask only when stdin and stderr are both terminals. Otherwise print the
  usage to stderr and fail with the exact command that would have answered
  the question.

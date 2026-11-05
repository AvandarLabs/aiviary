# Node.js rules

These rules add to [`typescript.md`](typescript.md) for code that runs on
Node.js.

## Modules

- The package is ESM (`"type": "module"`). Never use `require` or
  `module.exports`.
- Import Node's built-ins with the `node:` prefix: `node:fs/promises`, not
  `fs/promises`.
- Relative imports name the `.ts` file they import:
  `import { buildGreeting } from "./greet/greet.ts"`. `tsc` rewrites the
  extension to `.js` when it builds (`rewriteRelativeImportExtensions`), and
  `tsc --noEmit` rejects an import without one.
- No path aliases (`@/...`). `tsc` does not rewrite them, so the built `dist/`
  would import a path that does not exist.
- Type-only imports and exports use `import type` / `export type`. The
  compiler enforces it (`verbatimModuleSyntax`).

## Erasable syntax only

Write TypeScript that a type stripper could erase, so the same source runs
under `tsx`, `tsc`, and Node's own type stripping. The compiler enforces it
(`erasableSyntaxOnly`):

- No `enum`. Use a string literal union, or an `as const` object when the
  values are needed at runtime.
- No `namespace`.
- No constructor parameter properties (`constructor(private name: string)`).

## The process

- Only `src/main.ts` touches the process as a whole. Set `process.exitCode`
  rather than calling `process.exit()`, which can cut off output that has not
  been flushed yet.
- Read environment variables in one module, validate them with Zod there, and
  pass the parsed values down. Never read `process.env` deep in the code.
- Never leave a promise floating. Every promise is awaited, returned, or
  explicitly handled.

## Errors

- Throw `Error` instances, never strings or plain objects.
- When rethrowing, wrap and keep the original:
  `throw new Error("reading the config", { cause: error })`.
- Catch only where you can add context or recover. A command's top-level
  failure is reported once, by `src/runAction.ts`.

## I/O

- Use the promise APIs (`node:fs/promises`, `node:readline/promises`), never the
  callback ones, and the synchronous ones only in a short script.
- Join paths with `node:path`; never concatenate them with `/`.
- Use `stream.pipeline` from `node:stream/promises` to connect streams, so
  errors and backpressure propagate.

## Building and dependencies

- `pnpm build` compiles `src/` to `dist/` with `tsc -p tsconfig.build.json`.
  The package's `bin` and `files` point at `dist/`, never at `src/`.
- Prefer what Node ships (`styleText` from `node:util`, `fetch`,
  `node:readline/promises`) over a dependency. Add a package only when it saves
  real work, and say why in the change that adds it.

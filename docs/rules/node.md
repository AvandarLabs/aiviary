# Node.js rules

These rules add to [`typescript.md`](typescript.md) for code that runs on
Node.js.

## Modules

- The package is ESM (`"type": "module"`). Never use `require` or
  `module.exports`.
- Import Node's built-ins with the `node:` prefix: `node:fs/promises`, not
  `fs/promises`.
- Relative imports name the `.ts` file they import:
  `import { renderHeader } from "./header/header.ts"`. Node runs these files
  directly, and `tsc --noEmit` rejects an import without an extension.
- No path aliases (`@/...`). Node does not resolve them.
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

- Only a package's entry point (`src/main.ts`, `scripts/birds/birds.ts`)
  touches the process as a whole. Set `process.exitCode`
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
  failure is reported once, where it returns its exit code.

## I/O

- Use the promise APIs (`node:fs/promises`, `node:readline/promises`), never the
  callback ones, and the synchronous ones only in a short script.
- Join paths with `node:path`; never concatenate them with `/`.
- Use `stream.pipeline` from `node:stream/promises` to connect streams, so
  errors and backpressure propagate.

## Running and dependencies

- There is no build step. Every package runs from its TypeScript source with
  Node's type stripping, and each bird's `bin` points at `src/main.ts`. This
  works because workspace packages resolve through symlinks to their real
  paths, which are outside `node_modules`. Shipping a bird some other way
  (Homebrew, npm) will need a bundling step first: see
  [`docs/architecture.md`](../architecture.md).
- Prefer what Node ships (`styleText` from `node:util`, `parseArgs`, `fetch`,
  `node:readline/promises`) over a dependency. Add a package only when it saves
  real work, and say why in the change that adds it.

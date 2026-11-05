# Monorepo rules

This repository is a pnpm workspace: the shared library under `packages/`
and one package per bird under `birds/`.

## Layout

- The root holds only what every package shares: the agent rules, `docs/`,
  the lint and format configuration, `tsconfig.base.json`, and the scripts
  under `scripts/`. Never put source code at the root.
- Libraries go under `packages/`, and each bird under `birds/`.
  `pnpm-workspace.yaml` lists both.
- Each package has its own `package.json`, `tsconfig.json` (extending the
  root's `tsconfig.base.json`), and tests. A package's `docs/` notes, if it
  needs any beyond the root's, live in the package.

## Dependencies

- A package that uses another one depends on it with `"workspace:*"`, never a
  relative path or a published version.
- Shared tooling (TypeScript, oxlint, oxfmt, vitest, tsx) is a root
  `devDependency`, and every package uses that one copy. Do not add it to a
  package again.
- When two packages need the same runtime library, keep them on one version:
  declare it once in a `catalog:` in `pnpm-workspace.yaml` and reference it as
  `"catalog:"` from each package.

## Running things

- The root scripts run across every package: `pnpm type-check` and
  `pnpm test` recurse, and `pnpm lint` and `pnpm format` cover the whole tree.
  `pnpm check` runs everything before a push.
- To work in one package, filter by its name:
  `pnpm --filter <package> <script>`. `pnpm crow` and `pnpm magpie` run a bird
  from the root.

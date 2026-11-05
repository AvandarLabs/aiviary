# aiviary

A command-line tool written in TypeScript for Node.js. Acclimate declares the
command-line surface, `tsx` runs the source while you develop, and `tsc`
compiles it to `dist/` for the installed command. oxlint, oxfmt, and vitest
keep it clean.

## Getting started

Node.js 22 or newer and pnpm are the prerequisites.

```sh
pnpm install            # install dependencies, plus any missing agent skill
pnpm dev --help         # run the CLI from source with tsx
pnpm dev greet Ada      # run one command from source
pnpm build              # compile src/ to dist/ with tsc
pnpm start --help       # run the compiled CLI
pnpm type-check         # run the TypeScript compiler without emitting
pnpm test               # run the test suite with vitest
pnpm lint               # lint with oxlint
pnpm format             # format with oxfmt
pnpm check              # format check, lint, build, type-check, and test: run before pushing
```

## Agent skills

Agent skills are not tracked in git, but `skills-lock.json` is.
A fresh clone needs nothing extra: `pnpm install` restores the locked skills.
Run `pnpm skills` to see what is installed and
`pnpm skills:update` to upgrade them. See
[`docs/skills.md`](docs/skills.md) for how the two skill managers
divide the work.

## Agent rules

Coding conventions live in `AGENTS.md`, which is the single source of truth.
`CLAUDE.md` (Claude Code) and `.cursor/rules/agents.mdc` (Cursor) are symlinks
to it, and it is also the file the Codex CLI reads natively. Update `AGENTS.md`
and every tool stays in sync.

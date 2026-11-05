# Architecture

aiviary builds **birds**: AI agent harnesses that each feel like their own
program, built on the [pi coding agent](https://pi.dev) without forking it.
This follows the same approach as Feynman, which wraps pi the same way.

## How a bird runs

```
crow ──▶ birds/crow/src/main.ts ──▶ runBird (@aiviary/core)
                                       │ 1. resolve the home: $CROW_HOME or ~/.crow
                                       │ 2. prepare it: write the theme, select it once
                                       │ 3. find the bird's resources
                                       ▼
              node <pi>/cli.js --extension core/extensions/branding.ts
                               --extension birds/crow/extensions/*.ts
                               --append-system-prompt birds/crow/SYSTEM.md
                               --skill birds/crow/skills
                               --prompt-template birds/crow/prompts
                               <everything the person typed>
              env: PI_CODING_AGENT_DIR=~/.crow/agent
                   AIVIARY_BRAND=<the brand as JSON>
                   PI_SKIP_VERSION_CHECK=1
```

pi is an ordinary dependency of `@aiviary/core` (pinned to an exact version)
and runs as a child process attached to the terminal. The bird exits with
pi's exit code.

### What makes a bird its own program

| Piece              | Where                              | How                                                                                                                                                                         |
| ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Command name       | `birds/<bird>/package.json` `bin`  | `pnpm birds link <bird>` links it onto the PATH.                                                                                                                            |
| Home               | `~/.<bird>/agent`                  | `PI_CODING_AGENT_DIR`. Settings, sessions, logins, and pi packages are never shared with `~/.pi` or another bird.                                                           |
| Header             | `core/extensions/branding.ts`      | `ctx.ui.setHeader` draws the bird's picture beside its name in block letters (`src/header/header.ts` lays it out).                                                          |
| Title and status   | `core/extensions/branding.ts`      | `setTitle` and `setWorkingMessage`. pi rewrites its own title after startup and on a session rename, so the extension sets the bird's again just after.                     |
| Theme              | `core/src/piTheme/piTheme.ts`      | pi's dark theme with every identity color pointed at the bird's palette, written to `~/.<bird>/agent/themes/<bird>.json` on every launch and selected once on a fresh home. |
| Instructions       | `birds/<bird>/SYSTEM.md`           | Appended to pi's system prompt, so pi's tool guidance stays.                                                                                                                |
| Behavior           | `birds/<bird>/extensions/*.ts`     | pi extensions. Crow's `git-guard.ts` asks before every push, PR creation or merge, and hard reset.                                                                          |
| Skills and prompts | `birds/<bird>/skills/`, `prompts/` | Loaded with `--skill` and `--prompt-template` when the directory exists.                                                                                                    |

The branding extension reads `AIVIARY_BRAND`. Without it (pi started any other
way) it does nothing, so plain pi is never rebranded.

### Known places that still say "pi"

pi's own strings that no extension hook reaches: the project-folder trust
prompt ("This allows pi to load..."), the "No models available" hint and its
documentation paths, and `--pi-help`. Changing them would need a fork or a
patch of pi, which this design avoids on purpose.

Skill discovery is pi's default: the bird's own `skills/` plus
`~/.agents/skills` and the project's `.agents/skills`. Giving a bird a curated
set only (`--no-skills` plus its own `--skill` paths) is a per-bird decision
still to make.

## Packages

| Package                           | Role                                                                                                                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/core` (`@aiviary/core`) | The launcher (`src/launch`, `src/runBird`), the bird's home (`src/home`), branding (`src/brand`, `src/header`, `extensions/branding.ts`), the theme (`src/piTheme`), and the setup tool (`src/setup`, `src/select`). `src/index.ts` is its public API. |
| `birds/crow`, `birds/magpie`      | One bird each: `src/brand.ts`, `src/main.ts`, `SYSTEM.md`, and optional `extensions/`, `skills/`, `prompts/`.                                                                                                                                          |
| `scripts/birds/birds.ts`          | `pnpm birds`: finds every bird under `birds/` by its `bin` and runs the setup tool for them.                                                                                                                                                           |

## Running from source

Nothing is built. Every package runs from TypeScript with Node's type
stripping (Node 22.19 or newer, the same floor pi sets), and a linked bird
points at `birds/<bird>/src/main.ts` in this checkout. That works because a
workspace dependency resolves through its symlink to a real path outside
`node_modules`, where Node allows type stripping. It also means an edit takes
effect on the next run.

The same holds for a consumer outside this repository that links
`@aiviary/core` by path, which is how brain's `pigeon` uses it today. Before a
bird ships through Homebrew or npm, where its dependencies sit inside
`node_modules`, it needs a bundling step (for example, one `tsdown` bundle per
bird) that turns its source and `@aiviary/core` into JavaScript.

## Adding a bird

1. Copy `birds/magpie` to `birds/<name>` and rename the package
   (`@aiviary/<name>`), its `bin`, and its `bird:link` / `bird:unlink`
   scripts.
2. Write `src/brand.ts`: the name, tagline, picture, block-letter banner (the
   current birds use figlet's "ANSI Shadow" font), palette, and working
   message. `src/brand.test.ts` checks it.
3. Write `SYSTEM.md`, and add `extensions/`, `skills/`, or `prompts/` as the
   bird needs them.
4. Add a `pnpm <name>` script at the root, run `pnpm install`, then
   `pnpm check`, and try it with `pnpm <name>`.

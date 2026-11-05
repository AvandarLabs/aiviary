# Architecture

aiviary builds **birds**: AI agent harnesses that each feel like their own
program, built on the [pi coding agent](https://pi.dev) without forking it.
This follows the same approach as Feynman, which wraps pi the same way.

## Every bird is an independent agent

Birds share code, never configuration. `@aiviary/core` and the pinned pi
package are libraries every bird runs on; everything a person can configure
belongs to exactly one bird. Installing, configuring, or breaking one bird
never changes another, and none of them reads or writes plain pi's `~/.pi`.

| Configuration                                        | Where it lives                                                    | How a person changes it                       |
| ---------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| Settings (model, theme, keybindings, resource lists) | `~/.<bird>/agent/settings.json`, `keybindings.json`               | `/settings` inside the bird, or the files     |
| Logins and API keys saved with `/login`              | `~/.<bird>/agent/auth.json`                                       | `/login` and `/logout` inside the bird        |
| Sessions                                             | `~/.<bird>/agent/sessions/`                                       | `--continue`, `--resume`, `/new`              |
| MCP servers                                          | `~/.<bird>/agent/mcp.json`                                        | The file, or `/mcp` inside the bird           |
| Personal instructions                                | `~/.<bird>/agent/AGENTS.md`                                       | The file                                      |
| Installed pi packages, extensions, skills, prompts   | `~/.<bird>/agent/` (`npm/`, `extensions/`, `skills/`, `prompts/`) | `<bird> install <source>`, or the directories |
| Project trust decisions                              | `~/.<bird>/agent/trust.json`                                      | The trust prompt inside the bird              |
| Environment settings                                 | `<BIRD>_*` variables, such as `CROW_OFFLINE=1`                    | The shell                                     |
| Where all of the above lives                         | `<BIRD>_HOME` (default `~/.<bird>`)                               | The shell                                     |

Three things a bird reads are not bird configuration, and the design keeps
each one explicit:

- **The shell environment.** Ordinary variables, including provider keys such
  as `ANTHROPIC_API_KEY`, reach every program the shell starts, birds
  included. To give birds different accounts, use `/login` in each bird
  instead of an exported key. pi's own `PI_*` variables are the exception:
  the launcher drops every inherited one (they were set for plain pi or a
  parent session) and builds the bird's from its `<BIRD>_*` variables
  (`buildPiEnv` in `packages/core/src/launch/launch.ts`).
- **The project.** A repository's `AGENTS.md`, `.agents/skills`, and `.pi/`
  belong to the project and are read by any agent working in it, once that
  bird trusts the project.
- **Machine-wide skills** in `~/.agents/skills`. Each bird's skill policy
  decides whether it loads them (see below).

A change to aiviary must keep this true: never add a file, directory, or
variable that two birds read as configuration. Shared behavior goes in
`@aiviary/core` as code, and each bird opts into it from its own package.

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
                   PI_<SETTING> from CROW_<SETTING> (inherited PI_* dropped)
                   AIVIARY_BRAND=<the brand as JSON>
                   PI_SKIP_VERSION_CHECK=1 unless CROW_SKIP_VERSION_CHECK says otherwise
```

pi is an ordinary dependency of `@aiviary/core` (pinned to an exact version)
and runs as a child process attached to the terminal. The bird exits with
pi's exit code.

### What makes a bird its own program

| Piece              | Where                              | How                                                                                                                                                                         |
| ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Command name       | `birds/<bird>/package.json` `bin`  | `pnpm birds link <bird>` links it onto the PATH.                                                                                                                            |
| Home               | `~/.<bird>/agent`                  | `PI_CODING_AGENT_DIR`. Every piece of configuration lives here and is never shared (see above).                                                                             |
| Header             | `core/extensions/branding.ts`      | `ctx.ui.setHeader` draws the bird's picture beside its name in block letters (`src/header/header.ts` lays it out).                                                          |
| Title and status   | `core/extensions/branding.ts`      | `setTitle` and `setWorkingMessage`. pi rewrites its own title after startup and on a session rename, so the extension sets the bird's again just after.                     |
| Theme              | `core/src/piTheme/piTheme.ts`      | pi's dark theme with every identity color pointed at the bird's palette, written to `~/.<bird>/agent/themes/<bird>.json` on every launch and selected once on a fresh home. |
| Instructions       | `birds/<bird>/SYSTEM.md`           | Appended to pi's system prompt, so pi's tool guidance stays.                                                                                                                |
| Behavior           | `birds/<bird>/extensions/*.ts`     | pi extensions. Crow's `git-guard.ts` asks before every push, PR creation or merge, and hard reset.                                                                          |
| Skills and prompts | `birds/<bird>/skills/`, `prompts/` | Loaded with `--skill` and `--prompt-template` when the directory exists. Which other skills it sees is its skill policy (below).                                            |

The branding extension reads `AIVIARY_BRAND`. Without it (pi started any other
way) it does nothing, so plain pi is never rebranded.

### Known places that still say "pi"

pi's own strings that no extension hook reaches: the project-folder trust
prompt ("This allows pi to load..."), the "No models available" hint and its
documentation paths, and `--pi-help`. Changing them would need a fork or a
patch of pi, which this design avoids on purpose.

### Which skills a bird sees

A bird always loads its own skills: its package's `skills/` and its home's
`agent/skills`. Its `skillPolicy` (in `BirdDefinition`) decides the rest.

| Policy                 | Also loads                                                             | Birds                                                                                     |
| ---------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `everything` (default) | The machine-wide `~/.agents/skills` and the project's `.agents/skills` | magpie                                                                                    |
| `own-and-project`      | Only the project's `.agents/skills`, once the project is trusted       | crow, and brain's pigeon (brain renders its skills into the workspace's `.agents/skills`) |

`own-and-project` works through pi's own resource filter: the launcher adds
one exclusion, `!<home>/.agents/skills/**`, to the bird's `skills` setting on
every run, and removes it again if the policy changes. The absolute pattern
matches only the machine-wide directory, so the bird's own skills and project
skills are untouched, and every other entry in that setting stays the
person's.

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

# aiviary

A family of branded AI agent harnesses ("birds") built on the
[pi coding agent](https://pi.dev). Each bird is its own command with its own
home directory, theme, ASCII-art header, system prompt, extensions, and
skills, so running it feels like running its own program, not pi.

| Bird   | Command  | Purpose                                                                                                                      |
| ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Crow   | `crow`   | Avandar's agent for production-quality company code. Strict about scope, TDD, review, and never publishing without approval. |
| Magpie | `magpie` | A personal agent for prototypes and experiments. Moves fast, skips team ceremony, still writes good code.                    |

A third bird, `pigeon` (brain and knowledge management), lives in the brain
repository and is built on `@aiviary/core` from here.

## Getting started

Node.js 22.19 or newer and pnpm are the prerequisites.

```sh
pnpm install            # install dependencies, plus any missing agent skill
pnpm crow               # run crow from this checkout
pnpm magpie -c          # run magpie, continuing its last session here
pnpm birds link crow    # put crow on your PATH (~/.local/bin by default)
pnpm birds list         # show which birds are linked
pnpm check              # format check, lint, type-check, and test
```

Each bird keeps its state in `~/.<bird>` (override with `CROW_HOME`,
`MAGPIE_HOME`), separate from pi's `~/.pi`. On first run, use `/login` inside
the bird to connect a model provider.

Linked commands point at this checkout, so an edit takes effect on the next
run. See [`docs/architecture.md`](docs/architecture.md) for how a bird is put
together and how to add one.

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

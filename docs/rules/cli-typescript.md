# TypeScript CLI rules

These rules say where [`cli-ux.md`](cli-ux.md) lives in this TypeScript code.
Read that file first: it holds the rules, and this one holds the mechanics.

## Arguments are Acclimate

The command-line surface is declared with
[Acclimate](https://www.npmjs.com/package/@avandar/acclimate)
(`@avandar/acclimate`). Each command is its own Acclimate CLI in its own
module (`src/greet/greet.ts` exports `GreetCli`), and `src/main.ts` only
composes them with `addCommand` and calls `Acclimate.run`.

```ts
export const GreetCli = Acclimate.createCLI("greet")
  .description("Print a greeting.")
  .addPositionalArg({ name: "name", type: "string", required: false })
  .addOption({
    name: "--shout",
    type: "boolean",
    required: false,
    defaultValue: false,
    description: "Uppercase the greeting.",
  })
  .action(async ({ name, shout }) => {
    await runAction(async () => {
      // ...
    });
  });
```

Know Acclimate's edges:

- An option's name is camel-cased in the action: `--dry-run` arrives as
  `dryRun`.
- Acclimate ignores an option nobody declared rather than refusing it. Declare
  every option a command reads, including global ones (`addGlobalOption`),
  which every subcommand inherits.
- There is no hook that runs before every command. Work that must happen first
  goes in `src/main.ts`, before `Acclimate.run`.
- Keep the logic out of the action. The action resolves its inputs and calls
  pure functions that are tested on their own (`buildGreeting`).

## Output

- Data goes to stdout with `process.stdout.write`. It is the only thing that
  does.
- Everything else (progress, warnings, failures) goes to stderr through `say`
  in `src/theme/theme.ts`. Do not use `Acclimate.log` or `console.log` for it:
  both write to stdout.
- Color goes through `paint(role, text)` in `src/theme/theme.ts`, which owns
  the palette. It uses Node's `styleText`, which leaves the text plain when
  stderr is not a terminal or `NO_COLOR` is set.

## Asking for a missing value: `src/prompt/prompt.ts`

Describe the missing value as a `Question` (what it is, what to ask, the flag
that answers it) and call `askIfMissing`. It asks on stderr only when stdin is
a terminal; otherwise it throws a message naming the flag.

```ts
const name = await askIfMissing({
  given: nameFromArgs,
  question: {
    subject: "name to greet",
    label: "Who should I greet?",
    flag: "the <name> argument",
  },
});
```

## Errors and exit codes

Wrap every action's body in `runAction` (`src/runAction.ts`). A thrown error
becomes one `error:` line on stderr and `process.exitCode = 1`, instead of an
unhandled rejection's stack trace.

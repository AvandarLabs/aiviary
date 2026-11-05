# TypeScript backend rules

These rules add to [`typescript.md`](typescript.md) for code that talks to a
backend service, server, or database. Each section covers one service. Add a
section when the project starts using a new one.

## Supabase-js

- Use `.throwOnError()` whenever possible instead of relying on destructuring
  the `{ error }` and then checking it in an `if`.
- Parameters that accept a Supabase admin client should always be named
  `supabaseAdminClient` instead of just `admin` or `adminClient`.

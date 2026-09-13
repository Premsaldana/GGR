# PostgreSQL/Supabase migration verification

## Implemented

The branch now contains provider-selected Drizzle schemas for SQLite and PostgreSQL, a pooled `pg` runtime, PostgreSQL schema bootstrap SQL, the canonical Supabase migration at `supabase/migrations/0001_initial_schema.sql`, provider-aware pricing reads and writes, and PostgreSQL-aware realtime state queries and server startup. SQLite remains the default provider.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Passed |
| `npx tsx src/__tests__/test-db-runtime.ts` | Passed |
| `npx tsx src/__tests__/test-pricing.ts` | Passed |
| `npx tsx src/__tests__/test-pricing-events.ts` | Passed |
| `node --check server.mjs` | Passed |
| `git diff --check` | Passed |
| Destructive SQL and secret scan | Passed; no credentials or destructive statements found |
| `npm run lint` | Existing repository lint baseline reports 85 errors and 41 warnings, primarily explicit `any` usage and unused variables outside this migration |
| `npm run build` with valid local session configuration | Compilation and TypeScript passed; Next build worker terminated with SIGSEGV during page-data collection in the sandbox native SQLite runtime |
| `npm run test:all` | Runtime/provider and pricing tests passed; invoice test process terminated with SIGSEGV in the sandbox `better-sqlite3` native module |
| Supabase apply | Not run: no Supabase connection URL or project credentials were available in the execution environment |

No secrets were added to the repository. Applying the SQL requires a target Supabase project connection configured outside Git, followed by the application smoke tests in PostgreSQL mode.

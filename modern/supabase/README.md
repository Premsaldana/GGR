# Supabase migration

The migration in `migrations/0001_initial_schema.sql` creates the PostgreSQL schema used by the application. Apply it with the Supabase CLI or the SQL editor against the target project, then configure the application with `DATABASE_PROVIDER=postgres` and the project’s pooled or direct `DATABASE_URL`.

The application also bootstraps this schema on startup when PostgreSQL mode is selected. The SQL is intentionally limited to application tables, indexes, and foreign keys; Supabase Auth, Storage buckets, and Row Level Security policies remain project-specific and must be configured separately when those services are enabled.

Do not commit connection strings, database passwords, `service_role` keys, or session secrets.

export type DatabaseProvider = 'sqlite' | 'postgres';

export function getDatabaseProvider(value = process.env.DATABASE_PROVIDER || 'sqlite'): DatabaseProvider {
  if (value === 'sqlite' || value === 'postgres') return value;
  throw new Error(`Unsupported DATABASE_PROVIDER: ${value}`);
}

export function isPostgresConnectionString(value: string) {
  return value.startsWith('postgres://') || value.startsWith('postgresql://');
}

export function isSqliteDatabasePath(value: string) {
  return !isPostgresConnectionString(value);
}

export function assertProviderMatchesUrl(provider: DatabaseProvider, databaseUrl: string) {
  const postgresUrl = isPostgresConnectionString(databaseUrl);
  if (provider === 'postgres' && !postgresUrl) {
    throw new Error('DATABASE_PROVIDER=postgres requires a postgresql:// or postgres:// DATABASE_URL');
  }
  if (provider === 'sqlite' && postgresUrl) {
    throw new Error('DATABASE_PROVIDER=sqlite requires a local SQLite DATABASE_URL path');
  }
}

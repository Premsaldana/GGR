import assert from 'node:assert/strict';
import { assertProviderMatchesUrl, getDatabaseProvider, isPostgresConnectionString, isSqliteDatabasePath } from '../db/runtime';

assert.equal(getDatabaseProvider('sqlite'), 'sqlite');
assert.equal(getDatabaseProvider('postgres'), 'postgres');
assert.equal(isPostgresConnectionString('postgresql://example'), true);
assert.equal(isPostgresConnectionString('postgres://example'), true);
assert.equal(isSqliteDatabasePath('./data/ggr.db'), true);
assert.doesNotThrow(() => assertProviderMatchesUrl('sqlite', './data/ggr.db'));
assert.doesNotThrow(() => assertProviderMatchesUrl('postgres', 'postgresql://example'));
assert.throws(() => assertProviderMatchesUrl('postgres', './data/ggr.db'));
assert.throws(() => assertProviderMatchesUrl('sqlite', 'postgresql://example'));
console.log('Database runtime compatibility tests passed');

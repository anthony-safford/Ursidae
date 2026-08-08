import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { createSqliteConnection } from '../../../db/createSqliteConnection.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(currentDir, 'migrations');

let cachedDb: BetterSQLite3Database | undefined;

/**
 * Returns the example tool database connection, creating it lazily on first use.
 * If `filenameOverride` is provided (e.g., `:memory:` for tests), creates and returns
 * a fresh connection without caching; otherwise returns the cached singleton.
 *
 * @param filenameOverride - Optional database filename override (e.g., `:memory:` for tests).
 * @returns A Drizzle-wrapped BetterSQLite3 database instance.
 */
export function getExampleDb(filenameOverride?: string): BetterSQLite3Database {
	if (filenameOverride !== undefined) {
		return createSqliteConnection({
			toolSlug: 'example',
			migrationsFolder,
			filenameOverride,
		});
	}

	if (!cachedDb) {
		cachedDb = createSqliteConnection({
			toolSlug: 'example',
			migrationsFolder,
		});
	}

	return cachedDb;
}

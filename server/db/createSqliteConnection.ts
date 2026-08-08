import path from 'node:path';
import { mkdirSync } from 'node:fs';
// eslint-disable-next-line @typescript-eslint/naming-convention
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { env } from '../config.js';

/**
 * Configuration options for creating a SQLite database connection.
 */
export interface CreateSqliteConnectionOptionsT {
	/** The tool slug used to derive the default database filename. */
	toolSlug: string;
	/** Absolute path to the tool's migrations directory. */
	migrationsFolder: string;
	/** Optional override for the database filename; if provided, used verbatim instead of the default DATA_DIR-based path. */
	filenameOverride?: string;
}

/**
 * Creates and returns a Drizzle SQLite database connection with automatic migrations applied.
 *
 * @param options - Configuration options for the connection.
 * @returns A Drizzle-wrapped BetterSQLite3 database instance with pending migrations applied.
 */
export function createSqliteConnection(
	options: CreateSqliteConnectionOptionsT
): BetterSQLite3Database {
	const resolvedPath =
		options.filenameOverride ?? path.join(env.DATA_DIR, `${options.toolSlug}.db`);

	if (resolvedPath !== ':memory:') {
		mkdirSync(path.dirname(resolvedPath), { recursive: true });
	}

	const sqliteDb = new Database(resolvedPath);
	const db = drizzle(sqliteDb);

	migrate(db, { migrationsFolder: options.migrationsFolder });

	return db;
}

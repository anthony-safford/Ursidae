import { type FastifyPluginCallback } from 'fastify';
import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { exampleCounter } from './db/schema.js';
import { getExampleDb } from './db/connection.js';

/**
 * Configuration options for the example routes plugin.
 */
export interface ExampleRoutesOptionsT {
	/** Optional database connection; if omitted, uses the singleton connection. */
	db?: BetterSQLite3Database;
}

/**
 * Retrieves or creates the single example counter row, initializing with count: 0 if needed.
 *
 * @param db - The Drizzle database instance.
 * @returns The counter row from the database.
 */
function getOrCreateCounterRow(db: BetterSQLite3Database): typeof exampleCounter.$inferSelect {
	let row = db.select().from(exampleCounter).get();

	if (!row) {
		db.insert(exampleCounter).values({ count: 0 }).run();
		row = db.select().from(exampleCounter).get();
	}

	return row!;
}

/**
 * Fastify plugin providing example tool counter endpoints.
 */
export const exampleRoutes: FastifyPluginCallback<ExampleRoutesOptionsT> = (
	fastify,
	opts,
	done
) => {
	const db = opts.db ?? getExampleDb();

	fastify.get('/counter', () => {
		const row = getOrCreateCounterRow(db);
		return { count: row.count };
	});

	fastify.post('/counter/increment', () => {
		const row = getOrCreateCounterRow(db);
		db.update(exampleCounter)
			.set({ count: row.count + 1 })
			.where(eq(exampleCounter.id, row.id))
			.run();

		const newRow = db.select().from(exampleCounter).where(eq(exampleCounter.id, row.id)).get();
		return { count: newRow?.count ?? 0 };
	});

	done();
};

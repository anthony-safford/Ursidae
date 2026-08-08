import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSqliteConnection } from '../createSqliteConnection';
import { exampleCounter } from '../../tools/example/db/schema';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const exampleMigrationsFolder = path.resolve(currentDir, '../../tools/example/db/migrations');

describe('createSqliteConnection', () => {
	it('creates a connection, applies migrations, and allows queries on the created table', () => {
		const db = createSqliteConnection({
			toolSlug: 'test-example',
			migrationsFolder: exampleMigrationsFolder,
			filenameOverride: ':memory:',
		});

		// Verify the table exists and is queryable by selecting all rows (should be empty initially)
		const rows = db.select().from(exampleCounter).all();
		expect(rows).toEqual([]);
	});

	it('two separate :memory: connections are independent', () => {
		// Create first connection and insert a row
		const db1 = createSqliteConnection({
			toolSlug: 'test-example-1',
			migrationsFolder: exampleMigrationsFolder,
			filenameOverride: ':memory:',
		});

		db1.insert(exampleCounter).values({ count: 5 }).run();
		const rows1 = db1.select().from(exampleCounter).all();
		expect(rows1).toHaveLength(1);
		expect(rows1[0]).toEqual({ id: 1, count: 5 });

		// Create a second connection and verify it doesn't see the row from db1
		const db2 = createSqliteConnection({
			toolSlug: 'test-example-2',
			migrationsFolder: exampleMigrationsFolder,
			filenameOverride: ':memory:',
		});

		const rows2 = db2.select().from(exampleCounter).all();
		expect(rows2).toEqual([]);
	});
});

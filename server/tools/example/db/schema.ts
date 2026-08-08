import { sqliteTable, integer } from 'drizzle-orm/sqlite-core';

/** Example tool counter table tracking increment operations. */
export const exampleCounter = sqliteTable('example_counter', {
	id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
	count: integer({ mode: 'number' }).notNull().default(0),
});

import {
	sqliteTable,
	integer,
	text,
	real,
	unique,
	type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';

/** Tasks table; sub-tasks are rows with `parentId` set, reusing the same shape as top-level tasks. */
export const tasks = sqliteTable('tasks', {
	id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
	parentId: integer({ mode: 'number' }).references((): AnySQLiteColumn => tasks.id, {
		onDelete: 'cascade',
	}),
	title: text().notNull(),
	description: text(),
	questions: text(),
	status: text({ enum: ['open', 'in_progress', 'done'] })
		.notNull()
		.default('open'),
	positionX: real().notNull().default(0),
	positionY: real().notNull().default(0),
	createdAt: integer({ mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer({ mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date()),
});

/** Relationship links between any two tasks (order/dependency/relation), independent of the parentId hierarchy. */
export const taskLinks = sqliteTable(
	'task_links',
	{
		id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
		sourceTaskId: integer({ mode: 'number' })
			.notNull()
			.references(() => tasks.id, { onDelete: 'cascade' }),
		targetTaskId: integer({ mode: 'number' })
			.notNull()
			.references(() => tasks.id, { onDelete: 'cascade' }),
		type: text({ enum: ['blocks', 'related', 'order'] })
			.notNull()
			.default('related'),
		createdAt: integer({ mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => ({
		uniqueEdge: unique().on(table.sourceTaskId, table.targetTaskId, table.type),
	})
);

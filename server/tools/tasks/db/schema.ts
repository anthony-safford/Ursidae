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
	status: text({ enum: ['discovery', 'research', 'plan'] })
		.notNull()
		.default('discovery'),
	positionX: real().notNull().default(0),
	positionY: real().notNull().default(0),
	createdAt: integer({ mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer({ mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date()),
});

/** Discrete open questions attached to a task, each removable independently. */
export const taskQuestions = sqliteTable('task_questions', {
	id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
	taskId: integer({ mode: 'number' })
		.notNull()
		.references(() => tasks.id, { onDelete: 'cascade' }),
	text: text().notNull(),
	createdAt: integer({ mode: 'timestamp_ms' })
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

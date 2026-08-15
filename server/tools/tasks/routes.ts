import { type FastifyPluginCallback } from 'fastify';
import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, eq } from 'drizzle-orm';
import { tasks, taskLinks, taskQuestions } from './db/schema.js';
import { getTasksDb } from './db/connection.js';

/**
 * Configuration options for the tasks routes plugin.
 */
export interface TasksRoutesOptionsT {
	/** Optional database connection; if omitted, uses the singleton connection. */
	db?: BetterSQLite3Database;
}

interface CreateTaskBodyT {
	title: string;
	description?: string;
	status?: 'discovery' | 'research' | 'plan';
	parentId?: number;
	positionX?: number;
	positionY?: number;
}

interface UpdateTaskBodyT {
	title?: string;
	description?: string;
	status?: 'discovery' | 'research' | 'plan';
	parentId?: number;
	positionX?: number;
	positionY?: number;
}

interface CreateTaskLinkBodyT {
	sourceTaskId: number;
	targetTaskId: number;
	type?: 'blocks' | 'related' | 'order';
}

interface CreateTaskQuestionBodyT {
	taskId: number;
	text: string;
}

// Fastify's typed-route generics require these exact PascalCase keys (Body/Params).
/* eslint-disable @typescript-eslint/naming-convention */
interface CreateTaskRouteT {
	Body: CreateTaskBodyT;
}
interface UpdateTaskRouteT {
	Params: { id: string };
	Body: UpdateTaskBodyT;
}
interface TaskIdParamRouteT {
	Params: { id: string };
}
interface CreateTaskLinkRouteT {
	Body: CreateTaskLinkBodyT;
}
interface CreateTaskQuestionRouteT {
	Body: CreateTaskQuestionBodyT;
}
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Fastify plugin providing tasks tool CRUD endpoints for tasks, their relationship links, and
 * their questions.
 */
export const tasksRoutes: FastifyPluginCallback<TasksRoutesOptionsT> = (fastify, opts, done) => {
	const db = opts.db ?? getTasksDb();

	fastify.get('/', () => {
		return db.select().from(tasks).all();
	});

	fastify.post<CreateTaskRouteT>('/', async (request, reply) => {
		const { title, description, status, parentId, positionX, positionY } = request.body;

		if (!title) {
			return reply
				.status(400)
				.send({ error: { code: 'VALIDATION_ERROR', message: 'title is required' } });
		}

		if (parentId !== undefined && !db.select().from(tasks).where(eq(tasks.id, parentId)).get()) {
			return reply.status(400).send({
				error: { code: 'VALIDATION_ERROR', message: 'parentId must reference an existing task' },
			});
		}

		const newTask = db
			.insert(tasks)
			.values({ title, description, status, parentId, positionX, positionY })
			.returning()
			.get();

		return reply.status(201).send(newTask);
	});

	fastify.patch<UpdateTaskRouteT>('/:id', async (request, reply) => {
		const id = Number(request.params.id);
		const existing = db.select().from(tasks).where(eq(tasks.id, id)).get();

		if (!existing) {
			return reply
				.status(404)
				.send({ error: { code: 'NOT_FOUND', message: `Task ${id} not found` } });
		}

		const { parentId } = request.body;
		if (parentId !== undefined && !db.select().from(tasks).where(eq(tasks.id, parentId)).get()) {
			return reply.status(400).send({
				error: { code: 'VALIDATION_ERROR', message: 'parentId must reference an existing task' },
			});
		}

		const patched = db
			.update(tasks)
			.set({ ...request.body, updatedAt: new Date() })
			.where(eq(tasks.id, id))
			.returning()
			.get();

		return reply.send(patched);
	});

	fastify.delete<TaskIdParamRouteT>('/:id', async (request, reply) => {
		const id = Number(request.params.id);
		const existing = db.select().from(tasks).where(eq(tasks.id, id)).get();

		if (!existing) {
			return reply
				.status(404)
				.send({ error: { code: 'NOT_FOUND', message: `Task ${id} not found` } });
		}

		db.delete(tasks).where(eq(tasks.id, id)).run();

		return reply.status(204).send();
	});

	fastify.get('/links', () => {
		return db.select().from(taskLinks).all();
	});

	fastify.post<CreateTaskLinkRouteT>('/links', async (request, reply) => {
		const { sourceTaskId, targetTaskId, type } = request.body;

		if (!sourceTaskId || !targetTaskId) {
			return reply.status(400).send({
				error: { code: 'VALIDATION_ERROR', message: 'sourceTaskId and targetTaskId are required' },
			});
		}

		if (sourceTaskId === targetTaskId) {
			return reply.status(400).send({
				error: { code: 'VALIDATION_ERROR', message: 'sourceTaskId and targetTaskId must differ' },
			});
		}

		const source = db.select().from(tasks).where(eq(tasks.id, sourceTaskId)).get();
		const target = db.select().from(tasks).where(eq(tasks.id, targetTaskId)).get();

		if (!source || !target) {
			return reply.status(400).send({
				error: {
					code: 'VALIDATION_ERROR',
					message: 'sourceTaskId and targetTaskId must reference existing tasks',
				},
			});
		}

		const linkType = type ?? 'related';
		const existingLink = db
			.select()
			.from(taskLinks)
			.where(
				and(
					eq(taskLinks.sourceTaskId, sourceTaskId),
					eq(taskLinks.targetTaskId, targetTaskId),
					eq(taskLinks.type, linkType)
				)
			)
			.get();

		if (existingLink) {
			return reply.status(400).send({
				error: { code: 'VALIDATION_ERROR', message: 'This link already exists' },
			});
		}

		const newLink = db
			.insert(taskLinks)
			.values({ sourceTaskId, targetTaskId, type: linkType })
			.returning()
			.get();

		return reply.status(201).send(newLink);
	});

	fastify.delete<TaskIdParamRouteT>('/links/:id', async (request, reply) => {
		const id = Number(request.params.id);
		const existing = db.select().from(taskLinks).where(eq(taskLinks.id, id)).get();

		if (!existing) {
			return reply
				.status(404)
				.send({ error: { code: 'NOT_FOUND', message: `Task link ${id} not found` } });
		}

		db.delete(taskLinks).where(eq(taskLinks.id, id)).run();

		return reply.status(204).send();
	});

	fastify.get('/questions', () => {
		return db.select().from(taskQuestions).all();
	});

	fastify.post<CreateTaskQuestionRouteT>('/questions', async (request, reply) => {
		const { taskId, text } = request.body;

		if (!text) {
			return reply
				.status(400)
				.send({ error: { code: 'VALIDATION_ERROR', message: 'text is required' } });
		}

		if (!taskId || !db.select().from(tasks).where(eq(tasks.id, taskId)).get()) {
			return reply.status(400).send({
				error: { code: 'VALIDATION_ERROR', message: 'taskId must reference an existing task' },
			});
		}

		const newQuestion = db.insert(taskQuestions).values({ taskId, text }).returning().get();

		return reply.status(201).send(newQuestion);
	});

	fastify.delete<TaskIdParamRouteT>('/questions/:id', async (request, reply) => {
		const id = Number(request.params.id);
		const existing = db.select().from(taskQuestions).where(eq(taskQuestions.id, id)).get();

		if (!existing) {
			return reply
				.status(404)
				.send({ error: { code: 'NOT_FOUND', message: `Task question ${id} not found` } });
		}

		db.delete(taskQuestions).where(eq(taskQuestions.id, id)).run();

		return reply.status(204).send();
	});

	done();
};

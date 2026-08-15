import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fastify } from 'fastify';
import { tasksRoutes } from '../routes';
import { getTasksDb } from '../db/connection';
import type { FastifyInstance } from 'fastify';

describe('tasksRoutes', () => {
	let app: FastifyInstance;

	beforeEach(async () => {
		app = fastify();
		// Register with an in-memory db for each test
		await app.register(tasksRoutes, {
			prefix: '/api/tasks',
			db: getTasksDb(':memory:'),
		});
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
	});

	it('GET /api/tasks on a fresh db returns 200 with an empty array', async () => {
		const response = await app.inject({ method: 'GET', url: '/api/tasks' });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual([]);
	});

	it('POST /api/tasks creates a task and returns 201 with the created row', async () => {
		const response = await app.inject({
			method: 'POST',
			url: '/api/tasks',
			payload: { title: 'Write the report' },
		});

		expect(response.statusCode).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(response.json().title).toBe('Write the report');
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(response.json().status).toBe('open');
	});

	it('POST /api/tasks without a title returns 400', async () => {
		const response = await app.inject({
			method: 'POST',
			url: '/api/tasks',
			payload: {},
		});

		expect(response.statusCode).toBe(400);
	});

	it('PATCH /api/tasks/:id updates fields and a fresh GET reflects the persisted change', async () => {
		const draft = await app.inject({
			method: 'POST',
			url: '/api/tasks',
			payload: { title: 'Draft plan' },
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const id = draft.json().id as number;

		const patched = await app.inject({
			method: 'PATCH',
			url: `/api/tasks/${id}`,
			payload: { positionX: 120, positionY: 45 },
		});

		expect(patched.statusCode).toBe(200);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(patched.json().positionX).toBe(120);

		// A fresh GET (separate inject call) proves the value round-tripped through the DB.
		const refetched = await app.inject({ method: 'GET', url: '/api/tasks' });
		const refetchedTasks: { id: number; positionX: number; positionY: number }[] = refetched.json();
		const refetchedTask = refetchedTasks.find((t) => t.id === id);

		expect(refetchedTask?.positionX).toBe(120);
		expect(refetchedTask?.positionY).toBe(45);
	});

	it('PATCH /api/tasks/:id for a nonexistent id returns 404', async () => {
		const response = await app.inject({
			method: 'PATCH',
			url: '/api/tasks/999',
			payload: { title: 'Nope' },
		});

		expect(response.statusCode).toBe(404);
	});

	it('DELETE /api/tasks/:id on a parent cascades to its child task and any referencing links', async () => {
		const parent = await app.inject({
			method: 'POST',
			url: '/api/tasks',
			payload: { title: 'Parent task' },
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const parentId = parent.json().id as number;

		const child = await app.inject({
			method: 'POST',
			url: '/api/tasks',
			payload: { title: 'Child task', parentId },
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const childId = child.json().id as number;

		const other = await app.inject({
			method: 'POST',
			url: '/api/tasks',
			payload: { title: 'Unrelated task' },
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const otherId = other.json().id as number;

		const link = await app.inject({
			method: 'POST',
			url: '/api/tasks/links',
			payload: { sourceTaskId: parentId, targetTaskId: otherId, type: 'related' },
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const linkId = link.json().id as number;

		const afterDelete = await app.inject({ method: 'DELETE', url: `/api/tasks/${parentId}` });
		expect(afterDelete.statusCode).toBe(204);

		const remainingTasks: { id: number }[] = (
			await app.inject({ method: 'GET', url: '/api/tasks' })
		).json();
		expect(remainingTasks.map((t) => t.id)).not.toContain(parentId);
		expect(remainingTasks.map((t) => t.id)).not.toContain(childId);
		expect(remainingTasks.map((t) => t.id)).toContain(otherId);

		const remainingLinks: { id: number }[] = (
			await app.inject({ method: 'GET', url: '/api/tasks/links' })
		).json();
		expect(remainingLinks.map((l) => l.id)).not.toContain(linkId);
	});

	it('POST /api/tasks/links creates a link between two existing tasks', async () => {
		const a = await app.inject({ method: 'POST', url: '/api/tasks', payload: { title: 'A' } });
		const b = await app.inject({ method: 'POST', url: '/api/tasks', payload: { title: 'B' } });
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const sourceTaskId = a.json().id as number;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const targetTaskId = b.json().id as number;

		const response = await app.inject({
			method: 'POST',
			url: '/api/tasks/links',
			payload: { sourceTaskId, targetTaskId, type: 'blocks' },
		});

		expect(response.statusCode).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(response.json().type).toBe('blocks');
	});

	it('POST /api/tasks/links rejects a link where source equals target', async () => {
		const a = await app.inject({ method: 'POST', url: '/api/tasks', payload: { title: 'A' } });
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const id = a.json().id as number;

		const response = await app.inject({
			method: 'POST',
			url: '/api/tasks/links',
			payload: { sourceTaskId: id, targetTaskId: id },
		});

		expect(response.statusCode).toBe(400);
	});

	it('POST /api/tasks/links rejects a link referencing a nonexistent task', async () => {
		const a = await app.inject({ method: 'POST', url: '/api/tasks', payload: { title: 'A' } });
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const id = a.json().id as number;

		const response = await app.inject({
			method: 'POST',
			url: '/api/tasks/links',
			payload: { sourceTaskId: id, targetTaskId: 999 },
		});

		expect(response.statusCode).toBe(400);
	});

	it('DELETE /api/tasks/links/:id removes the link', async () => {
		const a = await app.inject({ method: 'POST', url: '/api/tasks', payload: { title: 'A' } });
		const b = await app.inject({ method: 'POST', url: '/api/tasks', payload: { title: 'B' } });
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const sourceTaskId = a.json().id as number;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const targetTaskId = b.json().id as number;

		const link = await app.inject({
			method: 'POST',
			url: '/api/tasks/links',
			payload: { sourceTaskId, targetTaskId },
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const linkId = link.json().id as number;

		const afterDelete = await app.inject({ method: 'DELETE', url: `/api/tasks/links/${linkId}` });
		expect(afterDelete.statusCode).toBe(204);

		const remainingLinks: { id: number }[] = (
			await app.inject({ method: 'GET', url: '/api/tasks/links' })
		).json();
		expect(remainingLinks.map((l) => l.id)).not.toContain(linkId);
	});
});

import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { createTaskLink, deleteTaskLink, getTaskLinks } from '../tasksApi';
import type { TaskLinkT } from '../tasksModel';

const link: TaskLinkT = {
	id: 1,
	sourceTaskId: 1,
	targetTaskId: 2,
	type: 'blocks',
	createdAt: new Date().toISOString(),
};

describe('tasksApi links', () => {
	it('getTaskLinks fetches all links', async () => {
		server.use(http.get('/api/tasks/links', () => HttpResponse.json([link])));

		await expect(getTaskLinks()).resolves.toEqual([link]);
	});

	it('createTaskLink POSTs the link and returns the created row', async () => {
		let capturedBody: unknown;
		server.use(
			http.post('/api/tasks/links', async ({ request }) => {
				capturedBody = await request.json();
				return HttpResponse.json(link, { status: 201 });
			})
		);

		const result = await createTaskLink({ sourceTaskId: 1, targetTaskId: 2, type: 'blocks' });

		expect(result).toEqual(link);
		expect(capturedBody).toEqual({ sourceTaskId: 1, targetTaskId: 2, type: 'blocks' });
	});

	it('deleteTaskLink DELETEs the link by id', async () => {
		let requestedUrl: string | undefined;
		server.use(
			http.delete('/api/tasks/links/1', ({ request }) => {
				requestedUrl = request.url;
				return new HttpResponse(null, { status: 204 });
			})
		);

		await deleteTaskLink(1);

		expect(requestedUrl).toContain('/api/tasks/links/1');
	});
});

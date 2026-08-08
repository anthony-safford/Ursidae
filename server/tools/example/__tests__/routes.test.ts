import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fastify } from 'fastify';
import { exampleRoutes } from '../routes';
import { getExampleDb } from '../db/connection';
import type { FastifyInstance } from 'fastify';

describe('exampleRoutes', () => {
	let app: FastifyInstance;

	beforeEach(async () => {
		app = fastify();
		// Register with an in-memory db for each test
		await app.register(exampleRoutes, {
			prefix: '/api/example',
			db: getExampleDb(':memory:'),
		});
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
	});

	it('GET /api/example/counter on a fresh db returns 200 with count: 0', async () => {
		const response = await app.inject({
			method: 'GET',
			url: '/api/example/counter',
		});

		expect(response.statusCode).toBe(200);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(response.json().count).toBe(0);
	});

	it('POST /api/example/counter/increment returns 200 with count: 1 on first call', async () => {
		const response = await app.inject({
			method: 'POST',
			url: '/api/example/counter/increment',
		});

		expect(response.statusCode).toBe(200);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(response.json().count).toBe(1);
	});

	it('two sequential POST /api/example/counter/increment calls return count: 1 then count: 2', async () => {
		const response1 = await app.inject({
			method: 'POST',
			url: '/api/example/counter/increment',
		});

		expect(response1.statusCode).toBe(200);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(response1.json().count).toBe(1);

		const response2 = await app.inject({
			method: 'POST',
			url: '/api/example/counter/increment',
		});

		expect(response2.statusCode).toBe(200);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(response2.json().count).toBe(2);
	});

	it('GET /api/example/counter after incrementing twice reflects the persisted count: 2', async () => {
		// Increment twice
		await app.inject({
			method: 'POST',
			url: '/api/example/counter/increment',
		});

		await app.inject({
			method: 'POST',
			url: '/api/example/counter/increment',
		});

		// GET and verify
		const response = await app.inject({
			method: 'GET',
			url: '/api/example/counter',
		});

		expect(response.statusCode).toBe(200);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(response.json().count).toBe(2);
	});
});

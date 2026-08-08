import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../app';
import type { FastifyBaseLogger } from 'fastify';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '..', '..');
const distDir = path.resolve(repoRoot, 'dist');

describe('server/app', () => {
	it('GET /api/health returns 200 with status ok', async () => {
		const app = createApp();
		const response = await app.inject({ method: 'GET', url: '/api/health' });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ status: 'ok' });
	});

	it('GET an unknown /api route returns 404 with the shared error shape', async () => {
		const app = createApp();
		const response = await app.inject({ method: 'GET', url: '/api/does-not-exist' });

		expect(response.statusCode).toBe(404);
		expect(response.json()).toEqual(
			expect.objectContaining({
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				error: expect.objectContaining({
					code: 'NOT_FOUND',
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					message: expect.any(String),
				}),
			})
		);
	});

	it('a route that throws an error returns the shared error shape with a 500 status', async () => {
		const app = createApp();
		app.get('/api/__test-throws', () => {
			throw new Error('boom');
		});

		const response = await app.inject({ method: 'GET', url: '/api/__test-throws' });

		expect(response.statusCode).toBe(500);
		expect(response.json()).toEqual({
			error: {
				code: 'INTERNAL_ERROR',
				message: 'boom',
			},
		});
	});

	it('a route that throws a Fastify error with statusCode 400 returns the shared error shape with VALIDATION_ERROR code', async () => {
		const app = createApp();
		app.get('/api/__test-validation', () => {
			const err = new Error('bad input') as Error & { statusCode: number };
			err.statusCode = 400;
			throw err;
		});

		const response = await app.inject({ method: 'GET', url: '/api/__test-validation' });

		expect(response.statusCode).toBe(400);
		expect(response.json()).toEqual({
			error: {
				code: 'VALIDATION_ERROR',
				message: 'bad input',
			},
		});
	});
});

describe('server/app in production mode', () => {
	const originalEnv = { ...process.env };
	let didCreateDist = false;
	let didCreateIndexHtml = false;
	let backupIndexHtmlContent: string | null = null;

	beforeEach(() => {
		// Set up dist directory if it doesn't exist
		if (!existsSync(distDir)) {
			mkdirSync(distDir, { recursive: true });
			didCreateDist = true;
		}

		const indexPath = path.resolve(distDir, 'index.html');
		// Back up existing index.html if it exists
		if (existsSync(indexPath)) {
			backupIndexHtmlContent = readFileSync(indexPath, 'utf-8');
		}

		// Write test fixture
		writeFileSync(indexPath, '<!doctype html><html><body>test</body></html>');
		didCreateIndexHtml = true;

		// Set NODE_ENV to production and reset modules to pick it up
		process.env.NODE_ENV = 'production';
		vi.resetModules();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.restoreAllMocks();

		// Restore backed-up index.html or clean up created one
		const indexPath = path.resolve(distDir, 'index.html');
		if (backupIndexHtmlContent !== null && existsSync(indexPath)) {
			writeFileSync(indexPath, backupIndexHtmlContent);
			backupIndexHtmlContent = null;
		} else if (didCreateIndexHtml && existsSync(indexPath)) {
			rmSync(indexPath);
		}
		didCreateIndexHtml = false;
	});

	afterAll(() => {
		// Clean up only dist directory if we created it
		if (didCreateDist && existsSync(distDir)) {
			rmSync(distDir, { recursive: true });
		}
	});

	it('GET /api/health still returns 200 in production mode', async () => {
		const appModule = await import('../app');
		const app = appModule.createApp();
		const response = await app.inject({ method: 'GET', url: '/api/health' });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ status: 'ok' });
	});

	it('GET an unknown non-/api route serves index.html in production mode', async () => {
		const appModule = await import('../app');
		const app = appModule.createApp();
		const response = await app.inject({ method: 'GET', url: '/some-client-route' });

		expect(response.statusCode).toBe(200);
		expect(response.payload).toContain('test');
	});
});

describe('server/app with a custom logger', () => {
	it('logs errors via request.log.error when a logger is provided', async () => {
		const errorFn = vi.fn();
		const fakeLoggerBase = {
			level: 'info',
			fatal: vi.fn(),
			error: errorFn,
			warn: vi.fn(),
			info: vi.fn(),
			debug: vi.fn(),
			trace: vi.fn(),
			silent: vi.fn(),
		};
		const fakeLogger = {
			...fakeLoggerBase,
			child: vi.fn(() => fakeLogger),
		} as unknown as FastifyBaseLogger;

		const app = createApp({ logger: fakeLogger });
		app.get('/api/__test-logging-throws', () => {
			throw new Error('logged boom');
		});

		const response = await app.inject({ method: 'GET', url: '/api/__test-logging-throws' });

		expect(response.statusCode).toBe(500);
		expect(errorFn).toHaveBeenCalled();
	});
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('server/config', () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.restoreAllMocks();
	});

	it('applies default values when env vars are absent', async () => {
		delete process.env.FRONTEND_PORT;
		delete process.env.BACKEND_PORT;
		delete process.env.DATA_DIR;

		const { env } = await import('../config');

		expect(env.FRONTEND_PORT).toBe(5173);
		expect(env.BACKEND_PORT).toBe(3000);
		expect(env.DATA_DIR).toBe('./data');
	});

	it('parses and coerces valid overrides', async () => {
		process.env.FRONTEND_PORT = '4000';
		process.env.BACKEND_PORT = '4001';
		process.env.DATA_DIR = './custom-data';

		const { env } = await import('../config');

		expect(env.FRONTEND_PORT).toBe(4000);
		expect(env.BACKEND_PORT).toBe(4001);
		expect(env.DATA_DIR).toBe('./custom-data');
	});

	it('fails loudly and exits when a var is invalid', async () => {
		process.env.FRONTEND_PORT = 'not-a-port';
		const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		await import('../config');

		expect(errorSpy).toHaveBeenCalled();
		expect(exitSpy).toHaveBeenCalledWith(1);
	});
});

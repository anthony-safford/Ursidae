import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'node:path';
import pino from 'pino';

vi.mock('pino', () => {
	const loggerInstance = {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		fatal: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
		child: vi.fn(),
	};
	const mockPino = Object.assign(
		vi.fn(() => loggerInstance),
		{ transport: vi.fn(() => ({ mockTransportStream: true })) }
	);
	return { default: mockPino };
});

describe('createTransportTargets', () => {
	it('includes a pino-pretty console target in development', async () => {
		const loggerModule = await import('../logger');
		const targets = loggerModule.createTransportTargets('development', 'debug', './mylogs');

		expect(targets).toEqual([
			{
				target: 'pino/file',
				options: { destination: path.join('./mylogs', 'app.log'), mkdir: true },
				level: 'debug',
			},
			{ target: 'pino-pretty', options: { destination: 1 }, level: 'debug' },
		]);
	});

	it('uses a raw JSON console target in production', async () => {
		const loggerModule = await import('../logger');
		const targets = loggerModule.createTransportTargets('production', 'warn', './mylogs');

		expect(targets).toEqual([
			{
				target: 'pino/file',
				options: { destination: path.join('./mylogs', 'app.log'), mkdir: true },
				level: 'warn',
			},
			{ target: 'pino/file', options: { destination: 1 }, level: 'warn' },
		]);
	});
});

describe('createLogger / getLogger', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('constructs pino with the configured level and transport targets', async () => {
		const loggerModule = await import('../logger');
		const configModule = await import('../config');

		loggerModule.createLogger();

		const expectedTargets = loggerModule.createTransportTargets(
			process.env.NODE_ENV ?? 'development',
			configModule.env.LOG_LEVEL,
			configModule.env.LOG_DIR
		);
		expect(vi.mocked(pino.transport)).toHaveBeenCalledWith({ targets: expectedTargets });
		expect(vi.mocked(pino)).toHaveBeenCalledWith(
			{ level: configModule.env.LOG_LEVEL },
			expect.anything()
		);
	});

	it('getLogger caches and returns the same instance across calls', async () => {
		const loggerModule = await import('../logger');

		const first = loggerModule.getLogger();
		const second = loggerModule.getLogger();

		expect(first).toBe(second);
		expect(vi.mocked(pino)).toHaveBeenCalledTimes(1);
	});
});

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fastify, type FastifyInstance, type FastifyError, type FastifyBaseLogger } from 'fastify';
import fastifyStatic from '@fastify/static';
import { exampleRoutes } from './tools/example/routes.js';
import { tasksRoutes } from './tools/tasks/routes.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(currentDir, '..', 'dist');

/** Shape of every API error response, per ADR-0004's shared error convention. */
interface ErrorResponseBodyT {
	error: {
		code: string;
		message: string;
		details?: unknown;
	};
}

/**
 * Derives a machine-readable error code from a Fastify/HTTP status code.
 *
 * @param statusCode - The HTTP status code of the response.
 * @returns A machine-readable error code string.
 */
function getCodeForStatus(statusCode: number): string {
	if (statusCode === 400) return 'VALIDATION_ERROR';
	if (statusCode === 404) return 'NOT_FOUND';
	return 'INTERNAL_ERROR';
}

/**
 * Builds a configured Fastify application instance without starting it.
 *
 * @param options - Optional configuration; `logger` supplies a pino/Fastify-compatible logger instance (omit to disable logging, e.g. in tests).
 * @returns A Fastify instance with routes, error handling, and (in production) static serving registered.
 */
export function createApp(options: { logger?: FastifyBaseLogger } = {}): FastifyInstance {
	const app = options.logger
		? fastify({ loggerInstance: options.logger })
		: fastify({ logger: false });

	app.setErrorHandler((error: FastifyError, req, reply) => {
		const statusCode = error.statusCode ?? 500;
		req.log.error(error);
		const body: ErrorResponseBodyT = {
			error: {
				code: getCodeForStatus(statusCode),
				message: error.message,
			},
		};
		void reply.status(statusCode).send(body);
	});

	app.setNotFoundHandler((request, reply) => {
		const apiRoute = request.url.startsWith('/api');
		const production = process.env.NODE_ENV === 'production';

		if (!apiRoute && production) {
			void reply.sendFile('index.html');
			return;
		}

		const body: ErrorResponseBodyT = {
			error: {
				code: 'NOT_FOUND',
				message: `Route ${request.method}:${request.url} not found`,
			},
		};
		void reply.status(404).send(body);
	});

	app.get('/api/health', () => {
		return { status: 'ok' };
	});

	void app.register(exampleRoutes, { prefix: '/api/example' });
	void app.register(tasksRoutes, { prefix: '/api/tasks' });

	if (process.env.NODE_ENV === 'production') {
		void app.register(fastifyStatic, {
			root: distDir,
		});
	}

	return app;
}

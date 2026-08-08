import path from 'node:path';
import pino from 'pino';
import { env } from './config.js';

/**
 * Creates the pino transport target list: a file target is always included; the
 * console target is pretty-printed in development and raw JSON in production.
 *
 * @param nodeEnv - The current `NODE_ENV` value (e.g. 'development', 'production').
 * @param logLevel - The minimum log level to apply to each transport target.
 * @param logDir - The directory the log file should be written into.
 * @returns The array of pino transport target configurations.
 */
export function createTransportTargets(
	nodeEnv: string,
	logLevel: string,
	logDir: string
): pino.TransportTargetOptions[] {
	const fileTarget: pino.TransportTargetOptions = {
		target: 'pino/file',
		options: { destination: path.join(logDir, 'app.log'), mkdir: true },
		level: logLevel,
	};

	const consoleTarget: pino.TransportTargetOptions =
		nodeEnv === 'production'
			? { target: 'pino/file', options: { destination: 1 }, level: logLevel }
			: { target: 'pino-pretty', options: { destination: 1 }, level: logLevel };

	return [fileTarget, consoleTarget];
}

/**
 * Creates a new pino logger instance configured per ADR-0004 (console + file, pretty in dev).
 *
 * @returns A configured pino logger instance.
 */
export function createLogger(): pino.Logger {
	const targets = createTransportTargets(
		process.env.NODE_ENV ?? 'development',
		env.LOG_LEVEL,
		env.LOG_DIR
	);
	const transportStream = pino.transport({ targets }) as pino.DestinationStream;
	return pino({ level: env.LOG_LEVEL }, transportStream);
}

let cachedLogger: pino.Logger | undefined;

/**
 * Returns the shared application logger instance, creating it lazily on first use.
 *
 * @returns The shared pino logger instance.
 */
export function getLogger(): pino.Logger {
	cachedLogger ??= createLogger();
	return cachedLogger;
}

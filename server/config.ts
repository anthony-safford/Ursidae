import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Keys mirror .env var names (UPPER_SNAKE_CASE), not the camelCase convention.
/* eslint-disable @typescript-eslint/naming-convention */
const envSchema = z.object({
	FRONTEND_PORT: z.coerce.number().int().positive().default(5173),
	BACKEND_PORT: z.coerce.number().int().positive().default(3000),
	DATA_DIR: z.string().min(1).default('./data'),
});
/* eslint-enable @typescript-eslint/naming-convention */

/** The validated, typed application configuration derived from environment variables. */
type EnvT = z.infer<typeof envSchema>;

/**
 * Parses and validates `process.env` against the config schema, exiting the process on failure.
 *
 * @returns The validated, typed environment configuration.
 */
function getEnv(): EnvT {
	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		console.error('Invalid environment configuration:');
		for (const problem of result.error.issues) {
			console.error(`  - ${problem.path.join('.')}: ${problem.message}`);
		}
		process.exit(1);
	}

	return result.data;
}

// New tools that need their own env vars (e.g. API keys) extend envSchema above.
export const env = getEnv();

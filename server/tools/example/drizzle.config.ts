import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'drizzle-kit';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
	schema: path.resolve(currentDir, 'db/schema.ts'),
	out: path.resolve(currentDir, 'db/migrations'),
	dialect: 'sqlite',
});

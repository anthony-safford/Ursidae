import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'json-summary', 'html'],
			all: true,
			include: ['src/**/*.{ts,tsx}', 'server/**/*.ts'],
			exclude: [
				'node_modules/',
				'dist/',
				'src/**/__tests__/**',
				'server/**/__tests__/**',
				'src/test/**',
				'src/mocks/**',
				'src/main.tsx',
				'server/**/drizzle.config.ts',
			],
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 80,
				statements: 80,
			},
		},
		projects: [
			{
				extends: true,
				test: {
					name: 'client',
					environment: 'jsdom',
					include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
					setupFiles: ['./src/test/setup.ts'],
				},
			},
			{
				extends: true,
				test: {
					name: 'server',
					environment: 'node',
					include: ['server/**/__tests__/**/*.test.ts'],
					passWithNoTests: true,
				},
			},
		],
	},
});

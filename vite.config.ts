import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { env } from './server/config';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		port: env.FRONTEND_PORT,
	},
});

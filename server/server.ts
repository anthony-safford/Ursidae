import { createApp } from './app.js';
import { env } from './config.js';

const app = createApp();

app.listen({ port: env.BACKEND_PORT }, (err) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
});

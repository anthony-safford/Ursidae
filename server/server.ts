import { createApp } from './app.js';
import { env } from './config.js';
import { getLogger } from './logger.js';

const app = createApp({ logger: getLogger() });

app.listen({ port: env.BACKEND_PORT }, (err) => {
	if (err) {
		app.log.error(err);
		process.exit(1);
	}
});

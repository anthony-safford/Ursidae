import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** MSW server instance used to intercept network requests during tests. */
export const server = setupServer(...handlers);

import type { HttpHandler } from 'msw';

/** MSW request handlers, registered per tool as tools start calling real API routes. */
export const handlers: HttpHandler[] = [];

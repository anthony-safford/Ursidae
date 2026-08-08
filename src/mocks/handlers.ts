import type { HttpHandler } from 'msw';
import { http, HttpResponse } from 'msw';

// In-memory counter for MSW handlers
let exampleCounterValue = 0;

/**
 * MSW request handlers, registered per tool as tools start calling real API routes.
 * Includes example tool counter endpoints for component testing.
 */
export const handlers: HttpHandler[] = [
	http.get('/api/example/counter', () => {
		return HttpResponse.json({ count: exampleCounterValue });
	}),

	http.post('/api/example/counter/increment', () => {
		exampleCounterValue += 1;
		return HttpResponse.json({ count: exampleCounterValue });
	}),
];

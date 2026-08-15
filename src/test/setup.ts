import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { configure } from '@testing-library/react';
import { server } from '../mocks/server';

// Hidden aria-hidden elements shouldn't be matched by user-facing text/role queries —
// mirrors testing-library's existing script/style ignore list.
configure({ defaultIgnore: 'script, style, [aria-hidden="true"]' });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

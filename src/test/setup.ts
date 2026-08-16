import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { configure } from '@testing-library/react';
import { server } from '../mocks/server';

// Hidden aria-hidden elements shouldn't be matched by user-facing text/role queries —
// mirrors testing-library's existing script/style ignore list.
configure({ defaultIgnore: 'script, style, [aria-hidden="true"]' });

// jsdom doesn't implement ResizeObserver; @xyflow/react registers one per node (and reads the
// event's `target` from it, not its dimensions, which jsdom can't report anyway) so it just
// needs to exist and not throw.
class ResizeObserverMockT {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverMockT;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

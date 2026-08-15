import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { configure } from '@testing-library/react';
import { server } from '../mocks/server';

// Hidden aria-hidden elements shouldn't be matched by user-facing text/role queries —
// mirrors testing-library's existing script/style ignore list.
configure({ defaultIgnore: 'script, style, [aria-hidden="true"]' });

// jsdom has no layout engine and doesn't implement ResizeObserver at all, so anything that
// measures its container via ResizeObserver (Recharts' ResponsiveContainer, react-grid-layout's
// container-width tracking) would otherwise permanently see 0x0 and render no children. Report a
// fixed non-zero size on observe so those components actually render their content in tests.
globalThis.ResizeObserver ??= class {
	constructor(private readonly callback: ResizeObserverCallback) {}

	observe(target: Element): void {
		this.callback(
			[{ target, contentRect: { width: 400, height: 300 } } as ResizeObserverEntry],
			this
		);
	}

	unobserve(): void {}
	disconnect(): void {}
} as unknown as typeof ResizeObserver;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

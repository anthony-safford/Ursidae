import React, { lazy } from 'react';

/** Registry mapping tool slugs to lazy-loaded tool components. */
export const toolRegistry: Record<string, React.LazyExoticComponent<() => React.ReactElement>> = {
	example: lazy(() =>
		import('../tools/example/ExampleToolPage').then((m) => ({ default: m.ExampleToolPage }))
	),
};

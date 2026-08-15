import React, { lazy } from 'react';

/** Registry entry pairing a tool's display label with its lazy-loaded component. */
export interface ToolRegistryEntry {
	/** Human-readable display label for the tool. */
	label: string;
	/** Lazy-loaded component for the tool. */
	component: React.LazyExoticComponent<() => React.ReactElement>;
}

/** Registry mapping tool slugs to lazy-loaded tool components and their display labels. */
export const toolRegistry: Record<string, ToolRegistryEntry> = {
	example: {
		label: 'Example',
		component: lazy(() =>
			import('../tools/example/ExampleToolPage').then((m) => ({ default: m.ExampleToolPage }))
		),
	},
	finance: {
		label: 'Finance',
		component: lazy(() =>
			import('../tools/finance/FinanceToolPage').then((m) => ({ default: m.FinanceToolPage }))
		),
	},
};

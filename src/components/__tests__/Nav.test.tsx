import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { describe, expect, it } from 'vitest';
import { Nav } from '../Nav';

describe('Nav', () => {
	it('renders one breadcrumb link per registered tool', () => {
		const { hook } = memoryLocation({ path: '/', static: true });

		render(
			<Router hook={hook}>
				<Nav />
			</Router>
		);

		expect(screen.getByRole('link', { name: 'Example' })).toBeInTheDocument();
	});

	it('highlights the active route link', () => {
		const { hook } = memoryLocation({ path: '/tools/example', static: true });

		render(
			<Router hook={hook}>
				<Nav />
			</Router>
		);

		expect(screen.getByRole('link', { name: 'Example' })).toHaveClass('text-accent');
	});
});

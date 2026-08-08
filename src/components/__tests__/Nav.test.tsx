import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { describe, expect, it } from 'vitest';
import { Nav } from '../Nav';

describe('Nav', () => {
	it('renders a Home link and one link per registered tool', () => {
		const { hook } = memoryLocation({ path: '/', static: true });

		render(
			<Router hook={hook}>
				<Nav />
			</Router>
		);

		expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Example' })).toBeInTheDocument();
	});

	it('highlights the active route link', () => {
		const { hook } = memoryLocation({ path: '/tools/example', static: true });

		render(
			<Router hook={hook}>
				<Nav />
			</Router>
		);

		expect(screen.getByRole('link', { name: 'Example' })).toHaveClass('text-blue-600');
		expect(screen.getByRole('link', { name: 'Home' })).not.toHaveClass('text-blue-600');
	});
});

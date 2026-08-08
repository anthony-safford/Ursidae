import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

describe('App', () => {
	it('renders the landing page at the root route', () => {
		const { hook } = memoryLocation({ path: '/', static: true });

		render(
			<Router hook={hook}>
				<App />
			</Router>
		);

		expect(screen.getByRole('heading', { name: 'Available Tools' })).toBeInTheDocument();
	});

	it('renders the 404 page for an unmatched route', () => {
		const { hook } = memoryLocation({ path: '/nope', static: true });

		render(
			<Router hook={hook}>
				<App />
			</Router>
		);

		expect(screen.getByRole('heading', { name: '404 - Page Not Found' })).toBeInTheDocument();
	});

	it('lazy-loads the example tool at its registered route', async () => {
		const { hook } = memoryLocation({ path: '/tools/example', static: true });

		render(
			<Router hook={hook}>
				<App />
			</Router>
		);

		expect(await screen.findByRole('heading', { name: 'Example Tool' })).toBeInTheDocument();
	});
});

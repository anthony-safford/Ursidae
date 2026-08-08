import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { describe, expect, it } from 'vitest';
import { Layout } from '../Layout';

describe('Layout', () => {
	it('renders the site title, nav, and children', () => {
		const { hook } = memoryLocation({ path: '/', static: true });

		render(
			<Router hook={hook}>
				<Layout>
					<p>page content</p>
				</Layout>
			</Router>
		);

		expect(screen.getByRole('heading', { name: 'Urisdae' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
		expect(screen.getByText('page content')).toBeInTheDocument();
	});
});

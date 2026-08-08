import { render, screen } from '@testing-library/react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { describe, expect, it } from 'vitest';
import { LandingPage } from '../LandingPage';

describe('LandingPage', () => {
	it('renders one tile per registered tool', () => {
		const { hook } = memoryLocation({ path: '/', static: true });

		render(
			<Router hook={hook}>
				<LandingPage />
			</Router>
		);

		expect(screen.getByRole('heading', { name: 'Available Tools' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Example/ })).toBeInTheDocument();
	});
});

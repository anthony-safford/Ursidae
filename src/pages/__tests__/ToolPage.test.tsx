import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToolPage } from '../ToolPage';

describe('ToolPage', () => {
	it('lazy-loads the registered tool component for a known slug', async () => {
		render(<ToolPage name="example" />);

		expect(await screen.findByRole('heading', { name: 'Example Tool' })).toBeInTheDocument();
	});

	it('renders the 404 page for an unknown slug', () => {
		render(<ToolPage name="does-not-exist" />);

		expect(screen.getByRole('heading', { name: '404 - Page Not Found' })).toBeInTheDocument();
	});
});

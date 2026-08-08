import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotFoundPage } from '../NotFoundPage';

describe('NotFoundPage', () => {
	it('renders the 404 heading and message', () => {
		render(<NotFoundPage />);

		expect(screen.getByRole('heading', { name: '404 - Page Not Found' })).toBeInTheDocument();
		expect(screen.getByText(/doesn't exist/)).toBeInTheDocument();
	});
});

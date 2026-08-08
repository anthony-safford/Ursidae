import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowingChild = (): never => {
	throw new Error('boom');
};

describe('ErrorBoundary', () => {
	it('renders children when no error occurs', () => {
		render(
			<ErrorBoundary>
				<p>safe content</p>
			</ErrorBoundary>
		);

		expect(screen.getByText('safe content')).toBeInTheDocument();
	});

	it('renders the fallback UI when a child throws', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});

		render(
			<ErrorBoundary>
				<ThrowingChild />
			</ErrorBoundary>
		);

		expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();

		vi.restoreAllMocks();
	});
});

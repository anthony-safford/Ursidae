import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBanner } from '../ErrorBanner';

describe('ErrorBanner', () => {
	it('renders the message as an alert', () => {
		render(<ErrorBanner message="Failed to delete task." onDismiss={vi.fn()} />);

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to delete task.');
	});

	it('calls onDismiss when the dismiss button is clicked', async () => {
		const user = userEvent.setup();
		const onDismiss = vi.fn();
		render(<ErrorBanner message="Failed to delete task." onDismiss={onDismiss} />);

		await user.click(screen.getByRole('button', { name: 'Dismiss error' }));

		expect(onDismiss).toHaveBeenCalled();
	});
});

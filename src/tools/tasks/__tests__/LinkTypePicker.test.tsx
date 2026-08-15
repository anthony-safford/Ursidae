import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LinkTypePicker } from '../LinkTypePicker';

describe('LinkTypePicker', () => {
	it('renders with "Related" preselected', () => {
		render(<LinkTypePicker onConfirm={vi.fn()} onCancel={vi.fn()} />);

		expect(screen.getByRole('radio', { name: 'Related' })).toBeChecked();
		expect(screen.getByRole('radio', { name: 'Blocks' })).not.toBeChecked();
		expect(screen.getByRole('radio', { name: 'Order' })).not.toBeChecked();
	});

	it('calls onConfirm with the selected type', async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		render(<LinkTypePicker onConfirm={onConfirm} onCancel={vi.fn()} />);

		await user.click(screen.getByRole('radio', { name: 'Blocks' }));
		await user.click(screen.getByRole('button', { name: 'Add' }));

		expect(onConfirm).toHaveBeenCalledWith('blocks');
	});

	it('calls onCancel when Cancel is clicked', async () => {
		const user = userEvent.setup();
		const onCancel = vi.fn();
		render(<LinkTypePicker onConfirm={vi.fn()} onCancel={onCancel} />);

		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(onCancel).toHaveBeenCalled();
	});

	it('calls onCancel when the close button is clicked', async () => {
		const user = userEvent.setup();
		const onCancel = vi.fn();
		render(<LinkTypePicker onConfirm={vi.fn()} onCancel={onCancel} />);

		await user.click(screen.getByRole('button', { name: 'Close' }));

		expect(onCancel).toHaveBeenCalled();
	});
});

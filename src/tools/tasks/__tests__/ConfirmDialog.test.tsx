import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
	it('renders the title, message, and confirm label', () => {
		render(
			<ConfirmDialog
				title="Delete task?"
				message="This also deletes its sub-tasks."
				confirmLabel="Delete"
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>
		);

		expect(screen.getByRole('heading', { name: 'Delete task?' })).toBeInTheDocument();
		expect(screen.getByText('This also deletes its sub-tasks.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
	});

	it('calls onConfirm when the confirm button is clicked', async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		render(
			<ConfirmDialog
				title="Delete task?"
				message="This also deletes its sub-tasks."
				confirmLabel="Delete"
				onConfirm={onConfirm}
				onCancel={vi.fn()}
			/>
		);

		await user.click(screen.getByRole('button', { name: 'Delete' }));

		expect(onConfirm).toHaveBeenCalled();
	});

	it('calls onCancel when Cancel is clicked', async () => {
		const user = userEvent.setup();
		const onCancel = vi.fn();
		render(
			<ConfirmDialog
				title="Delete task?"
				message="This also deletes its sub-tasks."
				confirmLabel="Delete"
				onConfirm={vi.fn()}
				onCancel={onCancel}
			/>
		);

		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(onCancel).toHaveBeenCalled();
	});

	it('calls onCancel when the close button is clicked', async () => {
		const user = userEvent.setup();
		const onCancel = vi.fn();
		render(
			<ConfirmDialog
				title="Delete task?"
				message="This also deletes its sub-tasks."
				confirmLabel="Delete"
				onConfirm={vi.fn()}
				onCancel={onCancel}
			/>
		);

		await user.click(screen.getByRole('button', { name: 'Close' }));

		expect(onCancel).toHaveBeenCalled();
	});
});

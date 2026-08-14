import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GlobalDateFilter } from '../GlobalDateFilter';

describe('GlobalDateFilter', () => {
	it('renders a closed button with no range label when the range has no bounds', () => {
		render(<GlobalDateFilter value={{ start: null, end: null }} onChange={vi.fn()} />);

		const button = screen.getByLabelText('Filter by date range');
		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(button).toHaveTextContent('');
		expect(screen.queryByLabelText('Filter from date')).not.toBeInTheDocument();
	});

	it('shows the range as a label on the button when both bounds are set', () => {
		render(
			<GlobalDateFilter value={{ start: '2024-08-01', end: '2024-08-31' }} onChange={vi.fn()} />
		);

		expect(screen.getByLabelText('Filter by date range')).toHaveTextContent(
			'2024-08-01 – 2024-08-31'
		);
	});

	it('clicking the button opens a popover with from/to inputs reflecting the current range', async () => {
		const user = userEvent.setup();
		render(
			<GlobalDateFilter value={{ start: '2024-08-01', end: '2024-08-31' }} onChange={vi.fn()} />
		);

		await user.click(screen.getByLabelText('Filter by date range'));

		expect(screen.getByLabelText('Filter by date range')).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByLabelText('Filter from date')).toHaveValue('2024-08-01');
		expect(screen.getByLabelText('Filter to date')).toHaveValue('2024-08-31');
	});

	it('calls onChange with the updated start, preserving end', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<GlobalDateFilter value={{ start: null, end: '2024-08-31' }} onChange={onChange} />);

		await user.click(screen.getByLabelText('Filter by date range'));
		fireEvent.change(screen.getByLabelText('Filter from date'), {
			target: { value: '2024-08-01' },
		});

		expect(onChange).toHaveBeenCalledWith({ start: '2024-08-01', end: '2024-08-31' });
	});

	it('calls onChange with the updated end, preserving start', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<GlobalDateFilter value={{ start: '2024-08-01', end: null }} onChange={onChange} />);

		await user.click(screen.getByLabelText('Filter by date range'));
		fireEvent.change(screen.getByLabelText('Filter to date'), { target: { value: '2024-08-31' } });

		expect(onChange).toHaveBeenCalledWith({ start: '2024-08-01', end: '2024-08-31' });
	});

	it('shows a Clear control only when a range is set, and it resets both bounds', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<GlobalDateFilter value={{ start: '2024-08-01', end: '2024-08-31' }} onChange={onChange} />
		);

		await user.click(screen.getByLabelText('Filter by date range'));
		const clearButton = screen.getByRole('button', { name: 'Clear' });
		await user.click(clearButton);

		expect(onChange).toHaveBeenCalledWith({ start: null, end: null });
	});

	it('does not show a Clear control when the range has no bounds', async () => {
		const user = userEvent.setup();
		render(<GlobalDateFilter value={{ start: null, end: null }} onChange={vi.fn()} />);

		await user.click(screen.getByLabelText('Filter by date range'));

		expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
	});

	it('pressing Escape while open closes the popover', async () => {
		const user = userEvent.setup();
		render(<GlobalDateFilter value={{ start: null, end: null }} onChange={vi.fn()} />);

		await user.click(screen.getByLabelText('Filter by date range'));
		expect(screen.getByLabelText('Filter from date')).toBeInTheDocument();

		await user.keyboard('{Escape}');

		expect(screen.queryByLabelText('Filter from date')).not.toBeInTheDocument();
	});

	it('clicking outside the popover closes it', async () => {
		const user = userEvent.setup();
		render(
			<div>
				<GlobalDateFilter value={{ start: null, end: null }} onChange={vi.fn()} />
				<button type="button">Outside</button>
			</div>
		);

		await user.click(screen.getByLabelText('Filter by date range'));
		expect(screen.getByLabelText('Filter from date')).toBeInTheDocument();

		await user.click(screen.getByText('Outside'));

		expect(screen.queryByLabelText('Filter from date')).not.toBeInTheDocument();
	});
});

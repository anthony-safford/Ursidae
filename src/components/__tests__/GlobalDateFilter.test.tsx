import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GlobalDateFilter } from '../GlobalDateFilter';

describe('GlobalDateFilter', () => {
	it('renders empty from/to date inputs when the range has no bounds', () => {
		render(<GlobalDateFilter value={{ start: null, end: null }} onChange={vi.fn()} />);

		expect(screen.getByLabelText('Filter from date')).toHaveValue('');
		expect(screen.getByLabelText('Filter to date')).toHaveValue('');
	});

	it('reflects the current range in each input', () => {
		render(
			<GlobalDateFilter value={{ start: '2024-08-01', end: '2024-08-31' }} onChange={vi.fn()} />
		);

		expect(screen.getByLabelText('Filter from date')).toHaveValue('2024-08-01');
		expect(screen.getByLabelText('Filter to date')).toHaveValue('2024-08-31');
	});

	it('calls onChange with the updated start, preserving end', () => {
		const onChange = vi.fn();
		render(<GlobalDateFilter value={{ start: null, end: '2024-08-31' }} onChange={onChange} />);

		fireEvent.change(screen.getByLabelText('Filter from date'), {
			target: { value: '2024-08-01' },
		});

		expect(onChange).toHaveBeenCalledWith({ start: '2024-08-01', end: '2024-08-31' });
	});

	it('calls onChange with the updated end, preserving start', () => {
		const onChange = vi.fn();
		render(<GlobalDateFilter value={{ start: '2024-08-01', end: null }} onChange={onChange} />);

		fireEvent.change(screen.getByLabelText('Filter to date'), {
			target: { value: '2024-08-31' },
		});

		expect(onChange).toHaveBeenCalledWith({ start: '2024-08-01', end: '2024-08-31' });
	});

	it('clearing an input calls onChange with null for that bound', () => {
		const onChange = vi.fn();
		render(<GlobalDateFilter value={{ start: '2024-08-01', end: null }} onChange={onChange} />);

		fireEvent.change(screen.getByLabelText('Filter from date'), { target: { value: '' } });

		expect(onChange).toHaveBeenCalledWith({ start: null, end: null });
	});
});

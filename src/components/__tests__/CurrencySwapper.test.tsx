import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CurrencySwapper } from '../CurrencySwapper';

const OPTIONS = [
	{ code: 'USD', symbol: '$' },
	{ code: 'EUR', symbol: '€' },
];

describe('CurrencySwapper', () => {
	it('renders each option by its symbol', () => {
		render(<CurrencySwapper options={OPTIONS} value="USD" onChange={vi.fn()} />);

		expect(screen.getByRole('option', { name: '$' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: '€' })).toBeInTheDocument();
	});

	it('reflects the selected value', () => {
		render(<CurrencySwapper options={OPTIONS} value="EUR" onChange={vi.fn()} />);

		expect(screen.getByLabelText('Display currency')).toHaveValue('EUR');
	});

	it('calls onChange with the newly selected currency code', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<CurrencySwapper options={OPTIONS} value="USD" onChange={onChange} />);

		await user.selectOptions(screen.getByLabelText('Display currency'), 'EUR');

		expect(onChange).toHaveBeenCalledWith('EUR');
	});
});

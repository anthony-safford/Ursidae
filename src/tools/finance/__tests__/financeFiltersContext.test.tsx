import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FinanceFiltersProvider, useFinanceFilters } from '../financeFiltersContext';

const CurrencyProbe = (): React.ReactElement => {
	const { currency, setCurrency } = useFinanceFilters();
	return (
		<button type="button" onClick={() => setCurrency('EUR')}>
			{currency}
		</button>
	);
};

describe('FinanceFiltersProvider / useFinanceFilters', () => {
	it('throws when useFinanceFilters is called outside a provider', () => {
		// Suppress the expected React error-boundary console noise for this negative case.
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		expect(() => render(<CurrencyProbe />)).toThrow(
			'useFinanceFilters must be used within a FinanceFiltersProvider'
		);

		consoleError.mockRestore();
	});

	it('defaults currency to DEFAULT_CURRENCY (USD)', () => {
		render(
			<FinanceFiltersProvider>
				<CurrencyProbe />
			</FinanceFiltersProvider>
		);

		expect(screen.getByRole('button')).toHaveTextContent('USD');
	});

	it('accepts an initialCurrency override', () => {
		render(
			<FinanceFiltersProvider initialCurrency="GBP">
				<CurrencyProbe />
			</FinanceFiltersProvider>
		);

		expect(screen.getByRole('button')).toHaveTextContent('GBP');
	});

	it('setCurrency updates the shared value', async () => {
		const user = userEvent.setup();
		render(
			<FinanceFiltersProvider>
				<CurrencyProbe />
			</FinanceFiltersProvider>
		);

		await user.click(screen.getByRole('button'));

		expect(screen.getByRole('button')).toHaveTextContent('EUR');
	});
});

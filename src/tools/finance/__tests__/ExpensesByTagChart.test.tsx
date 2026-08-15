import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExpensesByTagChart } from '../ExpensesByTagChart';
import { OTHER_LABEL } from '../insightsModel';

describe('ExpensesByTagChart', () => {
	it('shows an empty state when there is no data', () => {
		render(<ExpensesByTagChart data={[]} displayCurrency="USD" />);

		expect(screen.getByText('No expenses in range.')).toBeInTheDocument();
	});

	it('renders a legend row per tag with the formatted amount, so values are visible without hovering', () => {
		render(
			<ExpensesByTagChart
				data={[
					{ tag: 'Groceries', amountMinorUnits: 5420 },
					{ tag: 'Bills', amountMinorUnits: 8999 },
				]}
				displayCurrency="USD"
			/>
		);

		expect(screen.getByText('Groceries')).toBeInTheDocument();
		expect(screen.getByText('$54.20')).toBeInTheDocument();
		expect(screen.getByText('Bills')).toBeInTheDocument();
		expect(screen.getByText('$89.99')).toBeInTheDocument();
	});

	it('formats legend amounts in the given display currency', () => {
		render(
			<ExpensesByTagChart
				data={[{ tag: 'Groceries', amountMinorUnits: 5000 }]}
				displayCurrency="EUR"
			/>
		);

		expect(screen.getByText('€50.00')).toBeInTheDocument();
	});

	it('renders exactly one legend row per data entry', () => {
		const { container } = render(
			<ExpensesByTagChart
				data={[
					{ tag: 'Groceries', amountMinorUnits: 5000 },
					{ tag: 'Bills', amountMinorUnits: 3000 },
					{ tag: 'Commute', amountMinorUnits: 1000 },
				]}
				displayCurrency="USD"
			/>
		);

		expect(container.querySelectorAll('li')).toHaveLength(3);
	});

	it('renders the OTHER_LABEL slice like any other tag', () => {
		render(
			<ExpensesByTagChart
				data={[{ tag: OTHER_LABEL, amountMinorUnits: 1000 }]}
				displayCurrency="USD"
			/>
		);

		expect(screen.getByText(OTHER_LABEL)).toBeInTheDocument();
	});
});

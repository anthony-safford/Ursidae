import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExpensesByDayChart } from '../ExpensesByDayChart';

describe('ExpensesByDayChart', () => {
	it('shows an empty state when there is no data', () => {
		render(<ExpensesByDayChart data={[]} displayCurrency="USD" />);

		expect(screen.getByText('No expenses in range.')).toBeInTheDocument();
	});

	it('renders a shortened MM-DD tick for each day on the x-axis', () => {
		render(
			<ExpensesByDayChart
				data={[
					{ date: '2024-08-01', amountMinorUnits: 5000 },
					{ date: '2024-08-03', amountMinorUnits: 3000 },
				]}
				displayCurrency="USD"
			/>
		);

		expect(screen.getByText('08-01')).toBeInTheDocument();
		expect(screen.getByText('08-03')).toBeInTheDocument();
	});

	it('renders currency-formatted y-axis ticks', () => {
		const { container } = render(
			<ExpensesByDayChart
				data={[{ date: '2024-08-01', amountMinorUnits: 5000 }]}
				displayCurrency="USD"
			/>
		);

		expect(container.querySelector('.recharts-yAxis')).toBeInTheDocument();
		expect(screen.getByText('$0.00')).toBeInTheDocument();
	});
});

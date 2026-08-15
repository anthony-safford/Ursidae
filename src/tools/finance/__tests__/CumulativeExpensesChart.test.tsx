import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CumulativeExpensesChart } from '../CumulativeExpensesChart';

describe('CumulativeExpensesChart', () => {
	it('shows an empty state when there is no data', () => {
		render(<CumulativeExpensesChart data={[]} displayCurrency="USD" />);

		expect(screen.getByText('No expenses in range.')).toBeInTheDocument();
	});

	it('renders a shortened MM-DD tick for each day on the x-axis', () => {
		render(
			<CumulativeExpensesChart
				data={[
					{ date: '2024-08-01', cumulativeMinorUnits: 5000 },
					{ date: '2024-08-03', cumulativeMinorUnits: 8000 },
				]}
				displayCurrency="USD"
			/>
		);

		expect(screen.getByText('08-01')).toBeInTheDocument();
		expect(screen.getByText('08-03')).toBeInTheDocument();
	});

	it('renders the area chart chrome', () => {
		const { container } = render(
			<CumulativeExpensesChart
				data={[{ date: '2024-08-01', cumulativeMinorUnits: 5000 }]}
				displayCurrency="USD"
			/>
		);

		expect(container.querySelector('.recharts-area')).toBeInTheDocument();
	});
});

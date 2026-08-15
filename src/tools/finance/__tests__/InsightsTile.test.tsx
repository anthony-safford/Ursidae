import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InsightsTile } from '../InsightsTile';
import { FinanceFiltersProvider } from '../financeFiltersContext';
import { ExpensesProvider } from '../expensesContext';
import type { DateRangeValue } from '../../../components/GlobalDateFilter';

/** Renders InsightsTile inside the providers it requires, optionally with non-default filters. */
const renderInsightsTile = (
	providerProps: { initialCurrency?: string; initialDateRange?: DateRangeValue } = {}
): ReturnType<typeof render> =>
	render(
		<FinanceFiltersProvider {...providerProps}>
			<ExpensesProvider>
				<InsightsTile />
			</ExpensesProvider>
		</FinanceFiltersProvider>
	);

describe('InsightsTile', () => {
	it('renders a labeled section for each of the three charts', () => {
		renderInsightsTile();

		expect(screen.getByText('By tag')).toBeInTheDocument();
		expect(screen.getByText('By day')).toBeInTheDocument();
		expect(screen.getByText('Cumulative')).toBeInTheDocument();
	});

	it('aggregates the seeded rows by their tag in the pie legend', () => {
		renderInsightsTile();

		// Seeded rows: Trader Joe's/Groceries $54.20, Metro Transit/Commute $12.00, Comcast/Bills $89.99
		expect(screen.getByText('Groceries')).toBeInTheDocument();
		expect(screen.getByText('$54.20')).toBeInTheDocument();
		expect(screen.getByText('Commute')).toBeInTheDocument();
		expect(screen.getByText('$12.00')).toBeInTheDocument();
		expect(screen.getByText('Bills')).toBeInTheDocument();
		expect(screen.getByText('$89.99')).toBeInTheDocument();
	});

	it('converts amounts to the selected display currency', () => {
		renderInsightsTile({ initialCurrency: 'EUR' });

		// 12.00 USD * 0.92 EUR/USD = 11.04 EUR
		expect(screen.getByText('€11.04')).toBeInTheDocument();
	});

	it('excludes rows outside the selected date range from the tag aggregation', () => {
		// Only Metro Transit (2024-08-03, Commute) falls inside this range.
		renderInsightsTile({ initialDateRange: { start: '2024-08-02', end: '2024-08-04' } });

		expect(screen.getByText('Commute')).toBeInTheDocument();
		expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
		expect(screen.queryByText('Bills')).not.toBeInTheDocument();
	});

	it('shows the by-day chart x-axis ticks only for dates within the selected range', () => {
		renderInsightsTile({ initialDateRange: { start: '2024-08-02', end: '2024-08-04' } });

		// Both the bar and cumulative charts share the single remaining date, "08-03".
		expect(screen.getAllByText('08-03').length).toBeGreaterThan(0);
		expect(screen.queryByText('08-01')).not.toBeInTheDocument();
		expect(screen.queryByText('08-05')).not.toBeInTheDocument();
	});
});

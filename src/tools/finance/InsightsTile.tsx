import React, { useMemo } from 'react';
import { useExpenses } from './expensesContext';
import { useFinanceFilters } from './financeFiltersContext';
import {
	aggregateByDay,
	aggregateByTag,
	cumulativeByDay,
	prepareChartableExpenses,
} from './insightsModel';
import { ExpensesByTagChart } from './ExpensesByTagChart';
import { ExpensesByDayChart } from './ExpensesByDayChart';
import { CumulativeExpensesChart } from './CumulativeExpensesChart';

/** Spending-analysis tile: expenditure by tag, by day, and running cumulative total. */
export const InsightsTile = (): React.ReactElement => {
	const { rows } = useExpenses();
	const { currency, dateRange } = useFinanceFilters();

	const chartableExpenses = useMemo(
		() => prepareChartableExpenses(rows, currency, dateRange),
		[rows, currency, dateRange]
	);

	const tagTotals = useMemo(() => aggregateByTag(chartableExpenses), [chartableExpenses]);
	const dayTotals = useMemo(() => aggregateByDay(chartableExpenses), [chartableExpenses]);
	const cumulativeTotals = useMemo(() => cumulativeByDay(chartableExpenses), [chartableExpenses]);

	return (
		<div className="flex h-full gap-md">
			<section className="flex min-h-0 min-w-0 flex-1 flex-col">
				<h3 className="mb-xs text-xs uppercase tracking-wide text-text-muted">By tag</h3>
				<div className="min-h-0 flex-1">
					<ExpensesByTagChart data={tagTotals} displayCurrency={currency} />
				</div>
			</section>
			<section className="flex min-h-0 min-w-0 flex-1 flex-col">
				<h3 className="mb-xs text-xs uppercase tracking-wide text-text-muted">By day</h3>
				<div className="min-h-0 flex-1">
					<ExpensesByDayChart data={dayTotals} displayCurrency={currency} />
				</div>
			</section>
			<section className="flex min-h-0 min-w-0 flex-1 flex-col">
				<h3 className="mb-xs text-xs uppercase tracking-wide text-text-muted">Cumulative</h3>
				<div className="min-h-0 flex-1">
					<CumulativeExpensesChart data={cumulativeTotals} displayCurrency={currency} />
				</div>
			</section>
		</div>
	);
};

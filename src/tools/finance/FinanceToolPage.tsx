import React from 'react';
import { TileGrid } from '../../components/TileGrid';
import { CurrencySwapper } from '../../components/CurrencySwapper';
import { GlobalDateFilter } from '../../components/GlobalDateFilter';
import { ExpensesTile } from './ExpensesTile';
import { InsightsTile } from './InsightsTile';
import { FinanceFiltersProvider, useFinanceFilters } from './financeFiltersContext';
import { ExpensesProvider } from './expensesContext';
import { CURRENCY_OPTIONS } from './exchangeRates';

/** Global controls shared across every tile: currency, date range, etc. */
const FinanceToolbar = (): React.ReactElement => {
	const { currency, setCurrency, dateRange, setDateRange } = useFinanceFilters();

	return (
		<>
			<CurrencySwapper options={CURRENCY_OPTIONS} value={currency} onChange={setCurrency} />
			<GlobalDateFilter value={dateRange} onChange={setDateRange} />
		</>
	);
};

/** Placeholder tool page for the general finance tool. */
export const FinanceToolPage = (): React.ReactElement => {
	return (
		<FinanceFiltersProvider>
			<ExpensesProvider>
				<div className="p-lg">
					<h2 className="text-2xl font-bold">Finance</h2>
					<p className="text-text-muted mb-lg">
						Track expenses, assets, and liabilities in one place. Drag a tile by its grip to
						reorder, or drag its bottom-right corner to resize.
					</p>
					<TileGrid
						toolbarStart={<FinanceToolbar />}
						tiles={[
							{ id: 'expenses', title: 'Expenses', content: <ExpensesTile />, w: 8, h: 2 },
							{
								id: 'insights',
								title: 'Insights',
								content: <InsightsTile />,
								w: 8,
								h: 2,
								minW: 6,
								minH: 2,
							},
							{ id: 'assets', title: 'Assets', content: '$482,300' },
							{ id: 'liabilities', title: 'Liabilities', content: '$118,900' },
							{ id: 'trend', title: 'Net Worth Trend', content: '+4.2% this month' },
							{ id: 'accounts', title: 'Accounts', content: '6 linked' },
							{ id: 'activity', title: 'Recent Activity', content: '12 transactions' },
						]}
					/>
				</div>
			</ExpensesProvider>
		</FinanceFiltersProvider>
	);
};

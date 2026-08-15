import React from 'react';
import { TileGrid } from '../../components/TileGrid';
import { ExpensesTile } from './ExpensesTile';

/** Placeholder tool page for the general finance tool. */
export const FinanceToolPage = (): React.ReactElement => {
	return (
		<div className="p-lg">
			<h2 className="text-2xl font-bold">Finance</h2>
			<p className="text-text-muted mb-lg">
				Track expenses, assets, and liabilities in one place. Drag a tile by its grip to reorder, or
				drag its bottom-right corner to resize.
			</p>
			<TileGrid
				tiles={[
					{ id: 'expenses', title: 'Expenses', content: <ExpensesTile />, w: 8, h: 2 },
					{ id: 'assets', title: 'Assets', content: '$482,300' },
					{ id: 'liabilities', title: 'Liabilities', content: '$118,900' },
					{ id: 'trend', title: 'Net Worth Trend', content: '+4.2% this month' },
					{ id: 'accounts', title: 'Accounts', content: '6 linked' },
					{ id: 'activity', title: 'Recent Activity', content: '12 transactions' },
				]}
			/>
		</div>
	);
};

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createExpenseDraft } from '../expenseModel';
import { ExpensesProvider, useExpenses } from '../expensesContext';
import type { ExpenseRow } from '../expensesContext';

const RowsProbe = (): React.ReactElement => {
	const { rows, dispatch } = useExpenses();
	return (
		<div>
			<span data-testid="count">{rows.length}</span>
			<ul>
				{rows.map((row) => (
					<li key={row.id}>{row.location}</li>
				))}
			</ul>
			<button type="button" onClick={() => dispatch({ type: 'remove', id: rows[0]?.id })}>
				Remove first
			</button>
		</div>
	);
};

const ONE_ROW: ExpenseRow[] = [
	{
		...createExpenseDraft({ date: '2024-08-10', location: 'Test Location' }),
		amountInput: '1.00',
		paymentType: 'Cash',
		tags: [],
		currency: 'USD',
	},
];

describe('ExpensesProvider / useExpenses', () => {
	it('throws when useExpenses is called outside a provider', () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		expect(() => render(<RowsProbe />)).toThrow(
			'useExpenses must be used within an ExpensesProvider'
		);

		consoleError.mockRestore();
	});

	it('defaults to the three seeded sample rows', () => {
		render(
			<ExpensesProvider>
				<RowsProbe />
			</ExpensesProvider>
		);

		expect(screen.getByTestId('count')).toHaveTextContent('3');
		expect(screen.getByText("Trader Joe's")).toBeInTheDocument();
		expect(screen.getByText('Metro Transit')).toBeInTheDocument();
		expect(screen.getByText('Comcast')).toBeInTheDocument();
	});

	it('accepts an initialRows override', () => {
		render(
			<ExpensesProvider initialRows={ONE_ROW}>
				<RowsProbe />
			</ExpensesProvider>
		);

		expect(screen.getByTestId('count')).toHaveTextContent('1');
		expect(screen.getByText('Test Location')).toBeInTheDocument();
	});

	it('dispatch updates the shared rows', async () => {
		const user = userEvent.setup();
		render(
			<ExpensesProvider initialRows={ONE_ROW}>
				<RowsProbe />
			</ExpensesProvider>
		);

		expect(screen.getByTestId('count')).toHaveTextContent('1');

		await user.click(screen.getByRole('button', { name: 'Remove first' }));

		expect(screen.getByTestId('count')).toHaveTextContent('0');
	});
});

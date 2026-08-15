import React, { createContext, useContext, useReducer } from 'react';
import { createExpenseDraft, DEFAULT_CURRENCY, ExpenseDraftT, normalizeTags } from './expenseModel';

/** Row in shared state with currency tracking. */
export interface ExpenseRow extends ExpenseDraftT {
	/** Currency code for this expense. */
	currency: string;
}

const INITIAL_ROWS: ExpenseRow[] = [
	{
		...createExpenseDraft({ date: '2024-08-01', location: "Trader Joe's" }),
		amountInput: '54.20',
		paymentType: 'Debit',
		tags: ['Groceries'],
		currency: DEFAULT_CURRENCY,
	},
	{
		...createExpenseDraft({ date: '2024-08-03', location: 'Metro Transit' }),
		amountInput: '12.00',
		paymentType: 'Card',
		tags: ['Commute'],
		currency: DEFAULT_CURRENCY,
	},
	{
		...createExpenseDraft({ date: '2024-08-05', location: 'Comcast' }),
		amountInput: '89.99',
		paymentType: 'Auto-pay',
		tags: ['Bills'],
		currency: DEFAULT_CURRENCY,
	},
];

export type RowAction =
	| { type: 'add'; seed?: { date?: string; location?: string }; draft?: ExpenseRow }
	| { type: 'update'; id: string; patch: Partial<ExpenseRow> }
	| { type: 'addTag'; id: string; tag: string }
	| { type: 'removeTag'; id: string; tag: string }
	| { type: 'remove'; id: string };

/** Reducer function for row state mutations. */
const rowsReducer = (state: ExpenseRow[], action: RowAction): ExpenseRow[] => {
	switch (action.type) {
		case 'add': {
			if (action.draft) {
				return [...state, action.draft];
			}
			const newDraft = createExpenseDraft(action.seed);
			return [
				...state,
				{
					...newDraft,
					currency: DEFAULT_CURRENCY,
				},
			];
		}
		case 'update': {
			return state.map((row) => (row.id === action.id ? { ...row, ...action.patch } : row));
		}
		case 'addTag': {
			return state.map((row) => {
				if (row.id === action.id) {
					const normalized = normalizeTags([...row.tags, action.tag]);
					return { ...row, tags: normalized };
				}
				return row;
			});
		}
		case 'removeTag': {
			return state.map((row) =>
				row.id === action.id
					? { ...row, tags: row.tags.filter((existing) => existing !== action.tag) }
					: row
			);
		}
		case 'remove': {
			return state.filter((row) => row.id !== action.id);
		}
	}
};

interface ExpensesValue {
	/** All expense rows, unfiltered — consumers apply their own currency/date-range views. */
	rows: ExpenseRow[];
	/** Dispatches a row mutation. */
	dispatch: React.Dispatch<RowAction>;
}

const ExpensesContext = createContext<ExpensesValue | undefined>(undefined);

interface ExpensesProviderProps {
	children: React.ReactNode;
	/** Initial rows; defaults to the seeded sample rows. Mainly useful in tests. */
	initialRows?: ExpenseRow[];
}

/** Shares the Financial Hub's expense rows with every tile beneath it (the table, charts, ...). */
export const ExpensesProvider = ({
	children,
	initialRows = INITIAL_ROWS,
}: ExpensesProviderProps): React.ReactElement => {
	const [rows, dispatch] = useReducer(rowsReducer, initialRows);

	return <ExpensesContext.Provider value={{ rows, dispatch }}>{children}</ExpensesContext.Provider>;
};

/** Reads the shared expense rows. Must be called from within an ExpensesProvider. */
export const useExpenses = (): ExpensesValue => {
	const context = useContext(ExpensesContext);
	if (!context) {
		throw new Error('useExpenses must be used within an ExpensesProvider');
	}
	return context;
};

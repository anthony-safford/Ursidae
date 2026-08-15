import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Trash } from '@phosphor-icons/react';
import {
	createExpenseDraft,
	DEFAULT_CURRENCY,
	ExpenseDraftT,
	formatMinorUnitsAsDecimalString,
	normalizeTags,
	parseAmountToMinorUnits,
} from './expenseModel';

/** Row in component state with currency tracking. */
interface ExpenseRow extends ExpenseDraftT {
	/** Currency code for this expense. */
	currency: string;
}

/** Strips everything but digits and a single decimal point from an amount input. */
const filterAmountInput = (value: string): string => {
	const digitsAndDot = value.replace(/[^0-9.]/g, '');
	const firstDot = digitsAndDot.indexOf('.');
	if (firstDot === -1) return digitsAndDot;
	return digitsAndDot.slice(0, firstDot + 1) + digitsAndDot.slice(firstDot + 1).replace(/\./g, '');
};

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

type SortKey = 'date' | 'amount' | 'location' | 'paymentType';
type SortDirection = 'asc' | 'desc';

interface SortState {
	/** Column currently sorted by. */
	key: SortKey;
	/** Sort direction for that column. */
	direction: SortDirection;
}

type RowAction =
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

interface SortableHeaderProps {
	/** Column this header sorts by. */
	sortKey: SortKey;
	/** Header label text. */
	label: string;
	/** Currently active sort, if any. */
	sort: SortState | undefined;
	/** Called with the column to sort by when clicked. */
	onSort: (key: SortKey) => void;
}

/** Clickable column header that toggles ascending/descending sort for its column. */
const SortableHeader = ({
	sortKey,
	label,
	sort,
	onSort,
}: SortableHeaderProps): React.ReactElement => {
	const isActive = sort?.key === sortKey;

	return (
		<th className="whitespace-nowrap pb-xs pr-md font-medium">
			<button
				type="button"
				onClick={() => onSort(sortKey)}
				className={`flex items-center gap-xs uppercase tracking-wide ${
					isActive ? 'text-accent' : 'hover:text-accent'
				}`}
			>
				{label}
				{isActive && <span aria-hidden="true">{sort.direction === 'asc' ? '▲' : '▼'}</span>}
			</button>
		</th>
	);
};

interface RowTagsProps {
	/** Tags currently attached to the row. */
	tags: string[];
	/** Called with a new tag to attach. */
	onAdd: (tag: string) => void;
	/** Called with a tag to remove. */
	onRemove: (tag: string) => void;
}

/** Small removable tag pills for one expense row, plus an inline control to add another. */
const RowTags = ({ tags, onAdd, onRemove }: RowTagsProps): React.ReactElement => {
	const [adding, setAdding] = useState(false);
	const [draft, setDraft] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (adding) inputRef.current?.focus();
	}, [adding]);

	const commitDraft = (): void => {
		const value = draft.trim();
		if (value) onAdd(value);
		setDraft('');
		setAdding(false);
	};

	return (
		<div className="flex flex-wrap items-center gap-xs">
			{tags.map((tag) => (
				<span
					key={tag}
					className="group flex items-center gap-xs rounded-brand border border-border px-sm py-xs text-xs text-text-muted"
				>
					{tag}
					<button
						type="button"
						onClick={() => onRemove(tag)}
						aria-label={`Remove tag ${tag}`}
						className="hidden leading-none text-text-muted hover:text-accent group-hover:inline"
					>
						×
					</button>
				</span>
			))}
			{adding ? (
				<input
					ref={inputRef}
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onBlur={commitDraft}
					onKeyDown={(event) => {
						if (event.key === 'Enter') commitDraft();
						if (event.key === 'Escape') {
							setDraft('');
							setAdding(false);
						}
					}}
					placeholder="Tag"
					className="w-16 rounded-brand border border-border bg-transparent px-sm py-xs text-xs text-text outline-none focus:border-accent"
				/>
			) : (
				<button
					type="button"
					onClick={() => setAdding(true)}
					className="rounded-brand border border-dashed border-border px-sm py-xs text-xs text-text-muted hover:border-accent hover:text-accent"
				>
					+ Tag
				</button>
			)}
		</div>
	);
};

/** Expenses tile content — an editable amount/location/payment-type table with per-row tags. */
export const ExpensesTile = (): React.ReactElement => {
	const [rows, dispatch] = useReducer(rowsReducer, INITIAL_ROWS);
	const [focusTarget, setFocusTarget] = useState<{ rowId: string; field: 'date' | 'location' }>();
	const [sort, setSort] = useState<SortState>();
	const fieldInputs = useRef<Record<string, HTMLInputElement | null>>({});
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!focusTarget) return;
		const input = fieldInputs.current[`${focusTarget.rowId}:${focusTarget.field}`];
		input?.focus();
		setFocusTarget(undefined);
	}, [focusTarget]);

	// Handle quick-entry keyboard shortcut scoped to this tile's focus only.
	// Keyboard events bubble up from focused elements, so a handler on the container
	// will only fire when focus is somewhere inside this component's subtree.
	const handleQuickEntryKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
		const target = event.target as HTMLElement | null;
		const isEditable =
			!!target &&
			(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

		if (isEditable || event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1) {
			return;
		}

		// Quick-entry now seeds location field only (not date, since native date input
		// doesn't support free-text partial typing like MM/DD text input did).
		event.preventDefault();
		const newDraft = createExpenseDraft({ location: event.key });
		dispatch({
			type: 'add',
			draft: { ...newDraft, currency: DEFAULT_CURRENCY },
		});
		setFocusTarget({ rowId: newDraft.id, field: 'location' });
	};

	const toggleSort = (key: SortKey): void => {
		setSort((prev) => {
			if (prev?.key !== key) return { key, direction: 'asc' };
			if (prev.direction === 'asc') return { key, direction: 'desc' };
			return undefined;
		});
	};

	const sortedRows = useMemo(() => {
		if (!sort) return rows;
		const { key, direction } = sort;
		const factor = direction === 'asc' ? 1 : -1;

		return [...rows].sort((a, b) => {
			if (key === 'amount') {
				const aVal = parseAmountToMinorUnits(a.amountInput) ?? 0;
				const bVal = parseAmountToMinorUnits(b.amountInput) ?? 0;
				return (aVal - bVal) * factor;
			}
			return a[key].localeCompare(b[key]) * factor;
		});
	}, [rows, sort]);

	return (
		<div
			ref={containerRef}
			onKeyDown={handleQuickEntryKeyDown}
			tabIndex={0}
			className="flex h-full flex-col focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
		>
			<table className="w-full text-left text-sm">
				<thead>
					<tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
						<SortableHeader sortKey="date" label="Date" sort={sort} onSort={toggleSort} />
						<SortableHeader sortKey="amount" label="Amount" sort={sort} onSort={toggleSort} />
						<SortableHeader sortKey="location" label="Location" sort={sort} onSort={toggleSort} />
						<SortableHeader
							sortKey="paymentType"
							label="Payment Type"
							sort={sort}
							onSort={toggleSort}
						/>
						<th className="whitespace-nowrap pb-xs font-medium">Tags</th>
						<th className="whitespace-nowrap pb-xs pl-sm font-medium">
							<span className="sr-only">Actions</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{sortedRows.map((row) => (
						<tr key={row.id} className="border-b border-border">
							<td className="whitespace-nowrap py-xs pr-md">
								<input
									ref={(element) => {
										fieldInputs.current[`${row.id}:date`] = element;
									}}
									type="date"
									value={row.date}
									onChange={(event) =>
										dispatch({
											type: 'update',
											id: row.id,
											patch: { date: event.target.value },
										})
									}
									className="w-32 bg-transparent text-text outline-none"
								/>
							</td>
							<td className="whitespace-nowrap py-xs pr-md">
								<div className="flex items-center gap-xs">
									<span className="text-text-muted">$</span>
									<input
										value={row.amountInput}
										onChange={(event) => {
											const filtered = filterAmountInput(event.target.value);
											dispatch({
												type: 'update',
												id: row.id,
												patch: { amountInput: filtered },
											});
										}}
										onBlur={(event) => {
											const parsed = parseAmountToMinorUnits(event.target.value);
											if (parsed !== undefined) {
												const formatted = formatMinorUnitsAsDecimalString(parsed);
												dispatch({
													type: 'update',
													id: row.id,
													patch: { amountInput: formatted },
												});
											}
										}}
										placeholder="0.00"
										className="w-16 bg-transparent text-text outline-none"
									/>
								</div>
							</td>
							<td className="whitespace-nowrap py-xs pr-md">
								<input
									ref={(element) => {
										fieldInputs.current[`${row.id}:location`] = element;
									}}
									value={row.location}
									onChange={(event) =>
										dispatch({
											type: 'update',
											id: row.id,
											patch: { location: event.target.value },
										})
									}
									placeholder="Location"
									className="w-32 bg-transparent text-text-muted outline-none"
								/>
							</td>
							<td className="whitespace-nowrap py-xs pr-md">
								<input
									value={row.paymentType}
									onChange={(event) =>
										dispatch({
											type: 'update',
											id: row.id,
											patch: { paymentType: event.target.value },
										})
									}
									placeholder="Type"
									className="w-24 bg-transparent text-text-muted outline-none"
								/>
							</td>
							<td className="py-xs">
								<RowTags
									tags={row.tags}
									onAdd={(tag) => dispatch({ type: 'addTag', id: row.id, tag })}
									onRemove={(tag) => dispatch({ type: 'removeTag', id: row.id, tag })}
								/>
							</td>
							<td className="whitespace-nowrap py-xs pl-sm">
								<button
									type="button"
									onClick={() => dispatch({ type: 'remove', id: row.id })}
									aria-label="Delete expense"
									className="text-text-muted hover:text-danger transition-colors duration-200"
								>
									<Trash size={14} weight="bold" />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<button
				type="button"
				onClick={() => dispatch({ type: 'add' })}
				className="mt-sm self-start text-xs uppercase tracking-wide text-text-muted hover:text-accent"
			>
				+ Add expense
			</button>
		</div>
	);
};

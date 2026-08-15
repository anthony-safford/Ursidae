import { ExpenseRow } from './expensesContext';
import { parseAmountToMinorUnits } from './expenseModel';
import { convertMinorUnits } from './exchangeRates';

/** Maximum number of distinct tag categories the pie chart shows before folding the rest into "Other". */
export const MAX_TAG_CATEGORIES = 6;

/** Label used for expenses with no tags, and for the folded tail beyond MAX_TAG_CATEGORIES. */
export const UNTAGGED_LABEL = 'Untagged';
export const OTHER_LABEL = 'Other';

/** An expense row narrowed to what the charts need: a real date, and an amount already converted to the display currency. */
export interface ChartableExpenseT {
	/** Calendar date (YYYY-MM-DD). */
	date: string;
	/** Amount in minor units, already converted to the display currency. */
	amountMinorUnits: number;
	/** Tags on the source row. */
	tags: string[];
}

/** True when date falls within [start, end] (either bound optional); an empty date is always included. */
export function isWithinDateRange(date: string, start: string | null, end: string | null): boolean {
	if (!date) return true;
	if (start && date < start) return false;
	if (end && date > end) return false;
	return true;
}

/**
 * Filters expense rows to a date range and converts each to the display currency, dropping
 * rows with no date yet (still being drafted) or an unparseable amount — charts need a
 * complete data point, unlike the Expenses table which always shows drafts in progress.
 */
export const prepareChartableExpenses = (
	rows: ExpenseRow[],
	displayCurrency: string,
	dateRange: { start: string | null; end: string | null }
): ChartableExpenseT[] => {
	const result: ChartableExpenseT[] = [];

	for (const row of rows) {
		if (!row.date || !isWithinDateRange(row.date, dateRange.start, dateRange.end)) continue;

		const minorUnits = parseAmountToMinorUnits(row.amountInput);
		if (minorUnits === undefined) continue;

		result.push({
			date: row.date,
			amountMinorUnits: convertMinorUnits(minorUnits, row.currency, displayCurrency),
			tags: row.tags,
		});
	}

	return result;
};

/** One slice of the expenditure-by-tag pie chart. */
export interface TagTotalT {
	/** Tag name, UNTAGGED_LABEL, or OTHER_LABEL for the folded tail. */
	tag: string;
	/** Total amount in minor units, in the display currency. */
	amountMinorUnits: number;
}

/**
 * Sums expenditure by tag. Each expense counts its full amount toward its first tag only
 * (or UNTAGGED_LABEL) — an expense with multiple tags is not split or double-counted.
 * Sorted by amount descending; beyond MAX_TAG_CATEGORIES, the tail folds into OTHER_LABEL.
 */
export const aggregateByTag = (expenses: ChartableExpenseT[]): TagTotalT[] => {
	const totals = new Map<string, number>();

	for (const expense of expenses) {
		const tag = expense.tags[0] ?? UNTAGGED_LABEL;
		totals.set(tag, (totals.get(tag) ?? 0) + expense.amountMinorUnits);
	}

	const sorted = [...totals.entries()]
		.map(([tag, amountMinorUnits]) => ({ tag, amountMinorUnits }))
		.sort((a, b) => b.amountMinorUnits - a.amountMinorUnits);

	if (sorted.length <= MAX_TAG_CATEGORIES) return sorted;

	const head = sorted.slice(0, MAX_TAG_CATEGORIES);
	const tailTotal = sorted
		.slice(MAX_TAG_CATEGORIES)
		.reduce((sum, entry) => sum + entry.amountMinorUnits, 0);

	return [...head, { tag: OTHER_LABEL, amountMinorUnits: tailTotal }];
};

/** One bucket of the expenditure-by-day bar chart. */
export interface DayTotalT {
	/** Calendar date (YYYY-MM-DD). */
	date: string;
	/** Total amount in minor units, in the display currency. */
	amountMinorUnits: number;
}

/** Sums expenditure by calendar day, sorted chronologically ascending. */
export const aggregateByDay = (expenses: ChartableExpenseT[]): DayTotalT[] => {
	const totals = new Map<string, number>();

	for (const expense of expenses) {
		totals.set(expense.date, (totals.get(expense.date) ?? 0) + expense.amountMinorUnits);
	}

	return [...totals.entries()]
		.map(([date, amountMinorUnits]) => ({ date, amountMinorUnits }))
		.sort((a, b) => a.date.localeCompare(b.date));
};

/** One point of the cumulative-expenditure line chart. */
export interface CumulativeDayTotalT {
	/** Calendar date (YYYY-MM-DD). */
	date: string;
	/** Running total in minor units, in the display currency, through this date. */
	cumulativeMinorUnits: number;
}

/** Running total of expenditure by calendar day, sorted chronologically ascending. */
export const cumulativeByDay = (expenses: ChartableExpenseT[]): CumulativeDayTotalT[] => {
	let runningTotal = 0;
	return aggregateByDay(expenses).map(({ date, amountMinorUnits }) => {
		runningTotal += amountMinorUnits;
		return { date, cumulativeMinorUnits: runningTotal };
	});
};

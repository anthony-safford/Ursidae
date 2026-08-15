import { describe, expect, it } from 'vitest';
import { createExpenseDraft } from '../expenseModel';
import type { ExpenseRow } from '../expensesContext';
import {
	aggregateByDay,
	aggregateByTag,
	cumulativeByDay,
	isWithinDateRange,
	MAX_TAG_CATEGORIES,
	OTHER_LABEL,
	prepareChartableExpenses,
	UNTAGGED_LABEL,
} from '../insightsModel';

/** Builds a minimal ExpenseRow for tests, overriding only what a case cares about. */
const makeRow = (overrides: Partial<ExpenseRow> = {}): ExpenseRow => ({
	...createExpenseDraft({ date: overrides.date ?? '2024-08-01' }),
	amountInput: '10.00',
	paymentType: 'Card',
	tags: [],
	currency: 'USD',
	...overrides,
});

describe('isWithinDateRange', () => {
	it('an empty date is always included, regardless of range', () => {
		expect(isWithinDateRange('', '2024-08-01', '2024-08-31')).toBe(true);
	});

	it('is true when neither bound is set', () => {
		expect(isWithinDateRange('2024-08-15', null, null)).toBe(true);
	});

	it('is false when the date is before start', () => {
		expect(isWithinDateRange('2024-07-31', '2024-08-01', null)).toBe(false);
	});

	it('is false when the date is after end', () => {
		expect(isWithinDateRange('2024-09-01', null, '2024-08-31')).toBe(false);
	});

	it('is true when the date is within both bounds (inclusive)', () => {
		expect(isWithinDateRange('2024-08-01', '2024-08-01', '2024-08-31')).toBe(true);
		expect(isWithinDateRange('2024-08-31', '2024-08-01', '2024-08-31')).toBe(true);
	});
});

describe('prepareChartableExpenses', () => {
	it('converts each row amount from its own currency to the display currency', () => {
		const rows = [makeRow({ amountInput: '10.00', currency: 'USD' })];

		const result = prepareChartableExpenses(rows, 'EUR', { start: null, end: null });

		// 10.00 USD * 0.92 EUR/USD = 9.20 EUR
		expect(result).toEqual([{ date: '2024-08-01', amountMinorUnits: 920, tags: [] }]);
	});

	it('drops rows with no date yet (still being drafted)', () => {
		const rows = [makeRow({ date: '' })];

		expect(prepareChartableExpenses(rows, 'USD', { start: null, end: null })).toEqual([]);
	});

	it('drops rows outside the date range', () => {
		const rows = [makeRow({ date: '2024-07-01' }), makeRow({ date: '2024-08-15' })];

		const result = prepareChartableExpenses(rows, 'USD', {
			start: '2024-08-01',
			end: '2024-08-31',
		});

		expect(result).toHaveLength(1);
		expect(result[0].date).toBe('2024-08-15');
	});

	it('drops rows with an unparseable amount', () => {
		const rows = [makeRow({ amountInput: '' })];

		expect(prepareChartableExpenses(rows, 'USD', { start: null, end: null })).toEqual([]);
	});

	it('carries the row tags through unchanged', () => {
		const rows = [makeRow({ tags: ['Groceries', 'Essentials'] })];

		const result = prepareChartableExpenses(rows, 'USD', { start: null, end: null });

		expect(result[0].tags).toEqual(['Groceries', 'Essentials']);
	});
});

describe('aggregateByTag', () => {
	it('sums amounts per first tag', () => {
		const expenses = [
			{ date: '2024-08-01', amountMinorUnits: 1000, tags: ['Groceries'] },
			{ date: '2024-08-02', amountMinorUnits: 500, tags: ['Groceries'] },
			{ date: '2024-08-03', amountMinorUnits: 2000, tags: ['Bills'] },
		];

		const result = aggregateByTag(expenses);

		expect(result).toEqual([
			{ tag: 'Bills', amountMinorUnits: 2000 },
			{ tag: 'Groceries', amountMinorUnits: 1500 },
		]);
	});

	it('buckets expenses with no tags under UNTAGGED_LABEL', () => {
		const expenses = [{ date: '2024-08-01', amountMinorUnits: 1000, tags: [] }];

		expect(aggregateByTag(expenses)).toEqual([{ tag: UNTAGGED_LABEL, amountMinorUnits: 1000 }]);
	});

	it('credits only the first tag on a multi-tag expense — no splitting or double-counting', () => {
		const expenses = [
			{ date: '2024-08-01', amountMinorUnits: 1000, tags: ['Groceries', 'Essentials'] },
		];

		const result = aggregateByTag(expenses);

		expect(result).toEqual([{ tag: 'Groceries', amountMinorUnits: 1000 }]);
	});

	it('sorts by amount descending', () => {
		const expenses = [
			{ date: '2024-08-01', amountMinorUnits: 100, tags: ['Small'] },
			{ date: '2024-08-02', amountMinorUnits: 900, tags: ['Big'] },
		];

		expect(aggregateByTag(expenses).map((entry) => entry.tag)).toEqual(['Big', 'Small']);
	});

	it('folds tags beyond MAX_TAG_CATEGORIES into OTHER_LABEL, preserving their total', () => {
		const expenses = Array.from({ length: MAX_TAG_CATEGORIES + 2 }, (unused, i) => ({
			date: '2024-08-01',
			// Descending amounts so tag order is deterministic: Tag0 is largest, TagN smallest.
			amountMinorUnits: 1000 - i * 10,
			tags: [`Tag${i}`],
		}));

		const result = aggregateByTag(expenses);

		expect(result).toHaveLength(MAX_TAG_CATEGORIES + 1);
		expect(result[MAX_TAG_CATEGORIES].tag).toBe(OTHER_LABEL);

		const foldedTail = expenses
			.slice(MAX_TAG_CATEGORIES)
			.reduce((sum, e) => sum + e.amountMinorUnits, 0);
		expect(result[MAX_TAG_CATEGORIES].amountMinorUnits).toBe(foldedTail);
	});
});

describe('aggregateByDay', () => {
	it('sums amounts per day', () => {
		const expenses = [
			{ date: '2024-08-01', amountMinorUnits: 100, tags: [] },
			{ date: '2024-08-01', amountMinorUnits: 200, tags: [] },
			{ date: '2024-08-02', amountMinorUnits: 50, tags: [] },
		];

		expect(aggregateByDay(expenses)).toEqual([
			{ date: '2024-08-01', amountMinorUnits: 300 },
			{ date: '2024-08-02', amountMinorUnits: 50 },
		]);
	});

	it('sorts chronologically ascending regardless of input order', () => {
		const expenses = [
			{ date: '2024-08-05', amountMinorUnits: 1, tags: [] },
			{ date: '2024-08-01', amountMinorUnits: 1, tags: [] },
			{ date: '2024-08-03', amountMinorUnits: 1, tags: [] },
		];

		expect(aggregateByDay(expenses).map((entry) => entry.date)).toEqual([
			'2024-08-01',
			'2024-08-03',
			'2024-08-05',
		]);
	});
});

describe('cumulativeByDay', () => {
	it('produces a running total in chronological order', () => {
		const expenses = [
			{ date: '2024-08-01', amountMinorUnits: 100, tags: [] },
			{ date: '2024-08-03', amountMinorUnits: 50, tags: [] },
			{ date: '2024-08-05', amountMinorUnits: 25, tags: [] },
		];

		expect(cumulativeByDay(expenses)).toEqual([
			{ date: '2024-08-01', cumulativeMinorUnits: 100 },
			{ date: '2024-08-03', cumulativeMinorUnits: 150 },
			{ date: '2024-08-05', cumulativeMinorUnits: 175 },
		]);
	});

	it('returns an empty array for no expenses', () => {
		expect(cumulativeByDay([])).toEqual([]);
	});
});

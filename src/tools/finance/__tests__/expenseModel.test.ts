import { describe, it, expect } from 'vitest';
import {
	DEFAULT_CURRENCY,
	isValidCalendarDate,
	parseAmountToMinorUnits,
	formatMinorUnitsAsDecimalString,
	formatCurrencyAmount,
	normalizeCurrencyCode,
	normalizeTags,
	createExpenseDraft,
	expenseSchema,
} from '../expenseModel';

describe('expenseModel', () => {
	describe('DEFAULT_CURRENCY', () => {
		it('should export DEFAULT_CURRENCY as USD', () => {
			expect(DEFAULT_CURRENCY).toBe('USD');
		});
	});

	describe('isValidCalendarDate', () => {
		it('should accept valid dates', () => {
			expect(isValidCalendarDate('2024-01-15')).toBe(true);
			expect(isValidCalendarDate('2024-12-31')).toBe(true);
			expect(isValidCalendarDate('2024-02-29')).toBe(true); // Leap year
			expect(isValidCalendarDate('2000-02-29')).toBe(true); // Leap year (divisible by 400)
		});

		it('should reject invalid leap year dates', () => {
			expect(isValidCalendarDate('2023-02-29')).toBe(false); // 2023 is not a leap year
			expect(isValidCalendarDate('1900-02-29')).toBe(false); // 1900 not divisible by 400
		});

		it('should reject invalid day-of-month values', () => {
			expect(isValidCalendarDate('2024-02-30')).toBe(false); // Feb has max 29 days
			expect(isValidCalendarDate('2024-04-31')).toBe(false); // April has 30 days
			expect(isValidCalendarDate('2024-06-31')).toBe(false); // June has 30 days
			expect(isValidCalendarDate('2024-09-31')).toBe(false); // September has 30 days
			expect(isValidCalendarDate('2024-11-31')).toBe(false); // November has 30 days
		});

		it('should reject invalid month/day values', () => {
			expect(isValidCalendarDate('2024-13-01')).toBe(false); // Invalid month
			expect(isValidCalendarDate('2024-00-15')).toBe(false); // Invalid month
			expect(isValidCalendarDate('2024-01-00')).toBe(false); // Invalid day
			expect(isValidCalendarDate('2024-01-32')).toBe(false); // Invalid day
		});

		it('should reject wrong format', () => {
			expect(isValidCalendarDate('08/01/2024')).toBe(false); // MM/DD/YYYY format
			expect(isValidCalendarDate('2024-1-5')).toBe(false); // Missing zero padding
			expect(isValidCalendarDate('2024/02/01')).toBe(false); // Slashes instead of dashes
			expect(isValidCalendarDate('')).toBe(false); // Empty string
			expect(isValidCalendarDate('2024')).toBe(false); // Year only
		});
	});

	describe('parseAmountToMinorUnits', () => {
		it('should parse standard decimal amounts', () => {
			expect(parseAmountToMinorUnits('54.20')).toBe(5420);
			expect(parseAmountToMinorUnits('12')).toBe(1200);
			expect(parseAmountToMinorUnits('0.5')).toBe(50);
			expect(parseAmountToMinorUnits('12.')).toBe(1200);
			expect(parseAmountToMinorUnits('.5')).toBe(50);
		});

		it('should truncate (not round) fractional parts longer than 2 digits', () => {
			expect(parseAmountToMinorUnits('12.555')).toBe(1255); // Truncated, not 1256
			expect(parseAmountToMinorUnits('99.999')).toBe(9999); // Truncated
		});

		it('should return undefined for invalid input', () => {
			expect(parseAmountToMinorUnits('')).toBeUndefined(); // Empty string
			expect(parseAmountToMinorUnits('-5')).toBeUndefined(); // Negative
			expect(parseAmountToMinorUnits('.')).toBeUndefined(); // Lone dot
		});

		it('should handle edge cases', () => {
			expect(parseAmountToMinorUnits('0')).toBe(0);
			expect(parseAmountToMinorUnits('0.00')).toBe(0);
			expect(parseAmountToMinorUnits('100')).toBe(10000);
		});
	});

	describe('formatMinorUnitsAsDecimalString', () => {
		it('should format amounts with two decimal places', () => {
			expect(formatMinorUnitsAsDecimalString(5420)).toBe('54.20');
			expect(formatMinorUnitsAsDecimalString(1200)).toBe('12.00');
		});

		it('should handle amounts under 100 with leading zero', () => {
			expect(formatMinorUnitsAsDecimalString(50)).toBe('0.50');
			expect(formatMinorUnitsAsDecimalString(5)).toBe('0.05');
		});

		it('should handle zero', () => {
			expect(formatMinorUnitsAsDecimalString(0)).toBe('0.00');
		});
	});

	describe('formatCurrencyAmount', () => {
		it('should format USD amounts with currency symbol', () => {
			const result = formatCurrencyAmount(5420, 'USD');
			expect(result).toContain('$');
			expect(result).toContain('54.20');
		});

		it('should format other currencies', () => {
			const eurResult = formatCurrencyAmount(5420, 'EUR');
			expect(eurResult).toMatch(/54[.,]20/); // EUR uses comma in some locales
		});
	});

	describe('normalizeCurrencyCode', () => {
		it('should trim whitespace and uppercase', () => {
			expect(normalizeCurrencyCode(' usd ')).toBe('USD');
			expect(normalizeCurrencyCode('eur')).toBe('EUR');
			expect(normalizeCurrencyCode('  gbp  ')).toBe('GBP');
		});

		it('should handle mixed case', () => {
			expect(normalizeCurrencyCode('UsD')).toBe('USD');
			expect(normalizeCurrencyCode('eUr')).toBe('EUR');
		});
	});

	describe('normalizeTags', () => {
		it('should deduplicate case-insensitively while preserving first-occurrence order and casing', () => {
			const input = ['Groceries', ' groceries ', 'Bills', 'GROCERIES'];
			const result = normalizeTags(input);
			expect(result).toEqual(['Groceries', 'Bills']);
		});

		it('should trim whitespace and drop empty entries', () => {
			const input = [' Travel ', '  ', 'Food'];
			const result = normalizeTags(input);
			expect(result).toEqual(['Travel', 'Food']);
		});

		it('should preserve order and casing of first occurrence', () => {
			const input = ['FIRST', 'first', 'First', 'Other', 'first'];
			const result = normalizeTags(input);
			expect(result).toEqual(['FIRST', 'Other']);
		});

		it('should handle empty array', () => {
			expect(normalizeTags([])).toEqual([]);
		});
	});

	describe('createExpenseDraft', () => {
		it('should create a draft with default empty fields', () => {
			const draft = createExpenseDraft();
			expect(draft.id).toBeTruthy();
			expect(draft.id).toMatch(/^row-/);
			expect(draft.date).toBe('');
			expect(draft.amountInput).toBe('');
			expect(draft.location).toBe('');
			expect(draft.paymentType).toBe('');
			expect(draft.tags).toEqual([]);
		});

		it('should seed date when provided', () => {
			const draft = createExpenseDraft({ date: '2024-08-01' });
			expect(draft.date).toBe('2024-08-01');
			expect(draft.location).toBe('');
		});

		it('should seed location when provided', () => {
			const draft = createExpenseDraft({ location: 'Grocery Store' });
			expect(draft.location).toBe('Grocery Store');
			expect(draft.date).toBe('');
		});

		it('should seed both date and location when both provided', () => {
			const draft = createExpenseDraft({ date: '2024-08-01', location: 'Restaurant' });
			expect(draft.date).toBe('2024-08-01');
			expect(draft.location).toBe('Restaurant');
		});

		it('should generate unique ids for multiple drafts', () => {
			const draft1 = createExpenseDraft();
			const draft2 = createExpenseDraft();
			expect(draft1.id).not.toBe(draft2.id);
		});
	});

	describe('expenseSchema', () => {
		it('should parse a valid expense object', () => {
			const validExpense = {
				id: 'exp-1',
				date: '2024-08-01',
				amountMinorUnits: 5420,
				currency: 'USD',
				location: 'Grocery Store',
				paymentType: 'Debit',
				tags: ['Food', 'Groceries'],
			};
			const result = expenseSchema.parse(validExpense);
			expect(result).toEqual(validExpense);
		});

		it('should reject invalid date', () => {
			const invalidExpense = {
				id: 'exp-1',
				date: '2024-02-30', // Invalid date
				amountMinorUnits: 5420,
				currency: 'USD',
				location: 'Store',
				paymentType: 'Debit',
				tags: [],
			};
			expect(() => expenseSchema.parse(invalidExpense)).toThrow();
		});

		it('should reject non-integer or negative amount', () => {
			const invalidExpense = {
				id: 'exp-1',
				date: '2024-08-01',
				amountMinorUnits: -100, // Negative
				currency: 'USD',
				location: 'Store',
				paymentType: 'Debit',
				tags: [],
			};
			expect(() => expenseSchema.parse(invalidExpense)).toThrow();
		});

		it('should reject malformed currency code', () => {
			const invalidExpense = {
				id: 'exp-1',
				date: '2024-08-01',
				amountMinorUnits: 5420,
				currency: 'us', // Not 3 uppercase letters
				location: 'Store',
				paymentType: 'Debit',
				tags: [],
			};
			expect(() => expenseSchema.parse(invalidExpense)).toThrow();
		});

		it('should reject empty location', () => {
			const invalidExpense = {
				id: 'exp-1',
				date: '2024-08-01',
				amountMinorUnits: 5420,
				currency: 'USD',
				location: '', // Empty
				paymentType: 'Debit',
				tags: [],
			};
			expect(() => expenseSchema.parse(invalidExpense)).toThrow();
		});

		it('should reject empty id', () => {
			const invalidExpense = {
				id: '', // Empty
				date: '2024-08-01',
				amountMinorUnits: 5420,
				currency: 'USD',
				location: 'Store',
				paymentType: 'Debit',
				tags: [],
			};
			expect(() => expenseSchema.parse(invalidExpense)).toThrow();
		});

		it('should reject non-integer amount', () => {
			const invalidExpense = {
				id: 'exp-1',
				date: '2024-08-01',
				amountMinorUnits: 54.5, // Not an integer
				currency: 'USD',
				location: 'Store',
				paymentType: 'Debit',
				tags: [],
			};
			expect(() => expenseSchema.parse(invalidExpense)).toThrow();
		});

		it('should accept valid non-USD currency codes', () => {
			const validExpense = {
				id: 'exp-1',
				date: '2024-08-01',
				amountMinorUnits: 5420,
				currency: 'EUR',
				location: 'Store',
				paymentType: 'Debit',
				tags: [],
			};
			const result = expenseSchema.parse(validExpense);
			expect(result.currency).toBe('EUR');
		});
	});
});

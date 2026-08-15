import { z } from 'zod';

/** Default currency code for expenses. */
export const DEFAULT_CURRENCY = 'USD';

/** Interface representing an in-progress, editable expense row before validation. */
export interface ExpenseDraftT {
	/** Unique identifier for this draft row. */
	id: string;
	/** Date in any format (user is still typing). */
	date: string;
	/** Amount input as user types (may be partial or invalid). */
	amountInput: string;
	/** Merchant or location name. */
	location: string;
	/** Payment method used. */
	paymentType: string;
	/** Category tags attached to this expense. */
	tags: string[];
}

/**
 * Validates whether a string is a valid calendar date in YYYY-MM-DD format.
 *
 * @param value - The date string to validate (must be YYYY-MM-DD).
 * @returns True if the string is a valid calendar date; false otherwise.
 */
export function isValidCalendarDate(value: string): boolean {
	const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (!dateRegex.test(value)) {
		return false;
	}

	const [yearStr, monthStr, dayStr] = value.split('-');
	const year = parseInt(yearStr, 10);
	const month = parseInt(monthStr, 10);
	const day = parseInt(dayStr, 10);

	// Create a date from the parts
	const date = new Date(year, month - 1, day);

	// Verify that the date didn't roll over
	// (e.g., 2024-02-30 would roll to 2024-03-01)
	return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * Converts a decimal amount string to an integer number of minor units (cents-equivalent).
 *
 * @param input - Decimal string like "54.20" or "12" or ".5". Returns undefined for invalid input.
 * @returns Integer minor units (e.g., 5420 for "54.20"), or undefined if input is invalid.
 */
export const parseAmountToMinorUnits = (input: string): number | undefined => {
	// Empty string is invalid
	if (input === '') {
		return undefined;
	}

	// A lone dot is invalid
	if (input === '.') {
		return undefined;
	}

	// Reject negative amounts
	if (input.startsWith('-')) {
		return undefined;
	}

	// Split on the decimal point
	const parts = input.split('.');
	if (parts.length > 2) {
		return undefined; // Multiple dots
	}

	const integerPart = parts[0];
	const fractionalPart = parts[1] ?? '';

	// Check if there are any digits at all
	if (!integerPart && !fractionalPart) {
		return undefined;
	}

	// Integer part can be empty (e.g., ".5" is valid)
	const normalizedInteger = integerPart || '0';

	// Pad or truncate fractional part to exactly 2 digits
	let normalizedFractional = fractionalPart.slice(0, 2);
	normalizedFractional = normalizedFractional.padEnd(2, '0');

	const combinedDigits = normalizedInteger + normalizedFractional;
	return parseInt(combinedDigits, 10);
};

/**
 * Converts an integer number of minor units back to a decimal string (inverse of parseAmountToMinorUnits).
 *
 * @param minorUnits - Nonnegative integer minor units. Assumes valid nonnegative integer input.
 * @returns Decimal string formatted with exactly two fractional digits (e.g., "54.20").
 */
export const formatMinorUnitsAsDecimalString = (minorUnits: number): string => {
	const str = minorUnits.toString().padStart(3, '0');
	return `${str.slice(0, -2)}.${str.slice(-2)}`;
};

/**
 * Formats an amount in minor units to a locale-aware currency display string.
 *
 * @param minorUnits - Nonnegative integer minor units (e.g., 5420 for 54.20).
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD').
 * @returns Locale-aware currency string with symbol (e.g., "$54.20").
 */
export const formatCurrencyAmount = (minorUnits: number, currencyCode: string): string => {
	const formatter = new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: currencyCode,
	});
	return formatter.format(minorUnits / 100);
};

/**
 * Normalizes a currency code by trimming whitespace and converting to uppercase.
 *
 * @param code - Currency code string that may have whitespace or lowercase letters.
 * @returns Trimmed, uppercase currency code (e.g., "USD").
 */
export const normalizeCurrencyCode = (code: string): string => {
	return code.trim().toUpperCase();
};

/**
 * Normalizes an array of tags by trimming, removing empty entries, and deduplicating case-insensitively.
 *
 * @param tags - Array of tag strings that may have whitespace or duplicates.
 * @returns Deduplicated tag array with first-occurrence order and casing preserved.
 */
export const normalizeTags = (tags: string[]): string[] => {
	const seen = new Set<string>();
	const result: string[] = [];

	for (const tag of tags) {
		const trimmed = tag.trim();
		if (trimmed === '') {
			continue; // Skip empty-after-trim entries
		}

		const lowerTag = trimmed.toLowerCase();
		if (!seen.has(lowerTag)) {
			seen.add(lowerTag);
			result.push(trimmed); // Preserve original casing of first occurrence
		}
	}

	return result;
};

/**
 * Creates a new expense draft with optional seeding for date and location.
 *
 * @param seed - Optional object with date and/or location to pre-populate.
 * @returns A new ExpenseDraftT with generated id and seeded fields.
 */
export function createExpenseDraft(seed?: { date?: string; location?: string }): ExpenseDraftT {
	return {
		id: `row-${crypto.randomUUID()}`,
		date: seed?.date ?? '',
		amountInput: '',
		location: seed?.location ?? '',
		paymentType: '',
		tags: [],
	};
}

/** Zod schema for a durable, validated expense object. */
export const expenseSchema = z.object({
	id: z.string().min(1, 'ID must be a nonempty string'),
	date: z.string().refine(isValidCalendarDate, 'Date must be a valid YYYY-MM-DD calendar date'),
	amountMinorUnits: z.number().int().nonnegative('Amount must be a nonnegative integer'),
	currency: z.string().regex(/^[A-Z]{3}$/, 'Currency must be exactly 3 uppercase ASCII letters'),
	location: z.string().min(1, 'Location must be nonempty'),
	paymentType: z.string().min(1, 'Payment type must be nonempty'),
	tags: z.array(z.string().min(1, 'Each tag must be nonempty')),
});

/** Inferred TypeScript type for a validated expense from expenseSchema. */
export type ExpenseT = z.infer<typeof expenseSchema>;

interface CurrencyDefinitionT {
	/** ISO 4217 currency code, e.g. "USD". */
	code: string;
	/** Symbol shown in the currency swapper, e.g. "$". */
	symbol: string;
	/** Approximate exchange rate relative to USD (1 USD = rate units of this currency). */
	rate: number;
}

/**
 * Approximate, manually-maintained exchange rates relative to USD.
 * Not live — this app has no network dependency by design.
 */
const CURRENCIES: CurrencyDefinitionT[] = [
	{ code: 'USD', symbol: '$', rate: 1 },
	{ code: 'EUR', symbol: '€', rate: 0.92 },
	{ code: 'GBP', symbol: '£', rate: 0.79 },
	{ code: 'JPY', symbol: '¥', rate: 149.5 },
];

/** Currency options for CurrencySwapper, in display order. */
export const CURRENCY_OPTIONS = CURRENCIES.map(({ code, symbol }) => ({ code, symbol }));

/** Looks up a currency's exchange rate by code. */
function findRate(code: string): number | undefined {
	return CURRENCIES.find((currency) => currency.code === code)?.rate;
}

/**
 * Converts an amount in minor units from one currency to another using the
 * static CURRENCIES table above. Minor units are treated uniformly as
 * hundredths across all supported currencies (matching formatCurrencyAmount),
 * so this is an approximation rather than a currency-accurate conversion.
 *
 * @param minorUnits - Amount in minor units to convert.
 * @param from - Source currency code.
 * @param to - Target currency code.
 * @returns Converted amount in minor units, rounded to the nearest whole unit. Returns
 *   the original amount unchanged if either currency code is unsupported.
 */
export const convertMinorUnits = (minorUnits: number, from: string, to: string): number => {
	if (from === to) return minorUnits;

	const fromRate = findRate(from);
	const toRate = findRate(to);
	if (fromRate === undefined || toRate === undefined) return minorUnits;

	return Math.round((minorUnits / fromRate) * toRate);
};

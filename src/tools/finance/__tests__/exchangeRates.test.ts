import { describe, expect, it } from 'vitest';
import { CURRENCY_OPTIONS, convertMinorUnits } from '../exchangeRates';

describe('CURRENCY_OPTIONS', () => {
	it('includes USD, EUR, GBP, and JPY with their symbols', () => {
		expect(CURRENCY_OPTIONS).toEqual([
			{ code: 'USD', symbol: '$' },
			{ code: 'EUR', symbol: '€' },
			{ code: 'GBP', symbol: '£' },
			{ code: 'JPY', symbol: '¥' },
		]);
	});
});

describe('convertMinorUnits', () => {
	it('returns the input unchanged when from and to currencies match', () => {
		expect(convertMinorUnits(5420, 'USD', 'USD')).toBe(5420);
	});

	it('converts between two supported currencies using the static rate table', () => {
		// 54.20 USD * 0.92 EUR/USD = 49.864 EUR, rounded to 4986 minor units
		expect(convertMinorUnits(5420, 'USD', 'EUR')).toBe(4986);
	});

	it('round-trips through USD consistently', () => {
		// 100.00 GBP -> USD -> GBP should return to (approximately, after rounding) the original
		const usd = convertMinorUnits(10000, 'GBP', 'USD');
		const backToGbp = convertMinorUnits(usd, 'USD', 'GBP');
		expect(backToGbp).toBe(10000);
	});

	it('returns the input unchanged when either currency code is unsupported', () => {
		expect(convertMinorUnits(1000, 'USD', 'XYZ')).toBe(1000);
		expect(convertMinorUnits(1000, 'XYZ', 'USD')).toBe(1000);
	});
});

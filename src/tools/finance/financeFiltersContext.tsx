import React, { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_CURRENCY } from './expenseModel';
import type { DateRangeValue } from '../../components/GlobalDateFilter';

const NO_DATE_RANGE: DateRangeValue = { start: null, end: null };

interface FinanceFiltersValue {
	/** Currently selected display currency code, shared across the Financial Hub's tiles. */
	currency: string;
	/** Updates the selected display currency. */
	setCurrency: (currency: string) => void;
	/** Currently selected date range, shared across the Financial Hub's tiles. */
	dateRange: DateRangeValue;
	/** Updates the selected date range. */
	setDateRange: (range: DateRangeValue) => void;
}

const FinanceFiltersContext = createContext<FinanceFiltersValue | undefined>(undefined);

interface FinanceFiltersProviderProps {
	children: React.ReactNode;
	/** Initial selected currency; defaults to DEFAULT_CURRENCY. Mainly useful in tests. */
	initialCurrency?: string;
	/** Initial date range; defaults to no filter. Mainly useful in tests. */
	initialDateRange?: DateRangeValue;
}

/** Shares the Financial Hub's global toolbar filters (currency, date range) with every tile beneath it. */
export const FinanceFiltersProvider = ({
	children,
	initialCurrency = DEFAULT_CURRENCY,
	initialDateRange = NO_DATE_RANGE,
}: FinanceFiltersProviderProps): React.ReactElement => {
	const [currency, setCurrency] = useState(initialCurrency);
	const [dateRange, setDateRange] = useState<DateRangeValue>(initialDateRange);

	const value = useMemo(
		() => ({ currency, setCurrency, dateRange, setDateRange }),
		[currency, dateRange]
	);

	return <FinanceFiltersContext.Provider value={value}>{children}</FinanceFiltersContext.Provider>;
};

/** Reads the shared Financial Hub filters. Must be called from within a FinanceFiltersProvider. */
export const useFinanceFilters = (): FinanceFiltersValue => {
	const context = useContext(FinanceFiltersContext);
	if (!context) {
		throw new Error('useFinanceFilters must be used within a FinanceFiltersProvider');
	}
	return context;
};

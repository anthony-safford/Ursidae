import React, { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_CURRENCY } from './expenseModel';

interface FinanceFiltersValue {
	/** Currently selected display currency code, shared across the Financial Hub's tiles. */
	currency: string;
	/** Updates the selected display currency. */
	setCurrency: (currency: string) => void;
}

const FinanceFiltersContext = createContext<FinanceFiltersValue | undefined>(undefined);

interface FinanceFiltersProviderProps {
	children: React.ReactNode;
	/** Initial selected currency; defaults to DEFAULT_CURRENCY. Mainly useful in tests. */
	initialCurrency?: string;
}

/** Shares the Financial Hub's global toolbar filters (currency, ...) with every tile beneath it. */
export const FinanceFiltersProvider = ({
	children,
	initialCurrency = DEFAULT_CURRENCY,
}: FinanceFiltersProviderProps): React.ReactElement => {
	const [currency, setCurrency] = useState(initialCurrency);

	const value = useMemo(() => ({ currency, setCurrency }), [currency]);

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

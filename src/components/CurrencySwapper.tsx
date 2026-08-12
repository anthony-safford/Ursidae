import React from 'react';

export interface CurrencyOption {
	/** ISO 4217 currency code, e.g. "USD". */
	code: string;
	/** Symbol shown in the dropdown, e.g. "$". */
	symbol: string;
}

interface CurrencySwapperProps {
	/** Currency options to choose from. */
	options: CurrencyOption[];
	/** Currently selected currency code. */
	value: string;
	/** Called with the newly selected currency code. */
	onChange: (code: string) => void;
}

/** Compact symbol-only currency picker, meant for a tile grid's toolbar. */
export const CurrencySwapper = ({
	options,
	value,
	onChange,
}: CurrencySwapperProps): React.ReactElement => {
	return (
		<select
			value={value}
			onChange={(event) => onChange(event.target.value)}
			aria-label="Display currency"
			className="h-8 rounded-brand border border-border bg-surface px-sm text-sm text-text outline-none focus:border-accent"
		>
			{options.map((option) => (
				<option key={option.code} value={option.code}>
					{option.symbol}
				</option>
			))}
		</select>
	);
};

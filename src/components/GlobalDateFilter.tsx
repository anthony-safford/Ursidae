import React from 'react';
import { CalendarBlank } from '@phosphor-icons/react';

export interface DateRangeValue {
	/** Inclusive lower bound (YYYY-MM-DD), or null for no lower bound. */
	start: string | null;
	/** Inclusive upper bound (YYYY-MM-DD), or null for no upper bound. */
	end: string | null;
}

interface GlobalDateFilterProps {
	/** Currently selected date range. */
	value: DateRangeValue;
	/** Called with the updated date range whenever either bound changes. */
	onChange: (value: DateRangeValue) => void;
}

/** Compact from/to date-range filter, meant for a tile grid's toolbar. */
export const GlobalDateFilter = ({
	value,
	onChange,
}: GlobalDateFilterProps): React.ReactElement => {
	return (
		<div className="flex items-center gap-xs text-text-muted">
			<CalendarBlank size={16} weight="bold" aria-hidden="true" />
			<input
				type="date"
				aria-label="Filter from date"
				value={value.start ?? ''}
				onChange={(event) => onChange({ ...value, start: event.target.value || null })}
				className="h-8 rounded-brand border border-border bg-surface px-sm text-sm text-text outline-none focus:border-accent"
			/>
			<span aria-hidden="true">–</span>
			<input
				type="date"
				aria-label="Filter to date"
				value={value.end ?? ''}
				onChange={(event) => onChange({ ...value, end: event.target.value || null })}
				className="h-8 rounded-brand border border-border bg-surface px-sm text-sm text-text outline-none focus:border-accent"
			/>
		</div>
	);
};

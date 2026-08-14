import React, { useEffect, useRef, useState } from 'react';
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
	/** Called with the updated date range whenever either bound (or clear) changes it. */
	onChange: (value: DateRangeValue) => void;
}

const formatRangeLabel = (value: DateRangeValue): string | undefined => {
	if (!value.start && !value.end) return undefined;
	return `${value.start ?? '…'} – ${value.end ?? '…'}`;
};

/** Compact date-range filter: a single toolbar button that opens a from/to popover. */
export const GlobalDateFilter = ({
	value,
	onChange,
}: GlobalDateFilterProps): React.ReactElement => {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const label = formatRangeLabel(value);

	// Escape or clicking truly outside the popover closes it, mirroring TileGrid's add/delete menus.
	useEffect(() => {
		if (!open) return undefined;

		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === 'Escape') setOpen(false);
		};

		const handlePointerDown = (event: PointerEvent): void => {
			if (containerRef.current?.contains(event.target as Node)) return;
			setOpen(false);
		};

		window.addEventListener('keydown', handleKeyDown);
		document.addEventListener('pointerdown', handlePointerDown);
		return (): void => {
			window.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('pointerdown', handlePointerDown);
		};
	}, [open]);

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				aria-label="Filter by date range"
				aria-expanded={open}
				className={`flex h-8 items-center gap-xs rounded-brand border px-sm text-sm transition-colors duration-200 ${
					label ? 'border-accent text-accent' : 'border-border text-text-muted hover:text-accent'
				}`}
			>
				<CalendarBlank size={16} weight="bold" />
				{label && <span className="whitespace-nowrap">{label}</span>}
			</button>
			{open && (
				<div className="absolute left-0 top-full z-50 mt-xs min-w-56 rounded-brand border border-border bg-surface p-sm shadow-lg">
					<label className="flex items-center justify-between gap-sm py-xs text-xs text-text-muted">
						From
						<input
							type="date"
							aria-label="Filter from date"
							value={value.start ?? ''}
							onChange={(event) => onChange({ ...value, start: event.target.value || null })}
							className="rounded-brand border border-border bg-transparent px-sm py-xs text-sm text-text outline-none focus:border-accent"
						/>
					</label>
					<label className="flex items-center justify-between gap-sm py-xs text-xs text-text-muted">
						To
						<input
							type="date"
							aria-label="Filter to date"
							value={value.end ?? ''}
							onChange={(event) => onChange({ ...value, end: event.target.value || null })}
							className="rounded-brand border border-border bg-transparent px-sm py-xs text-sm text-text outline-none focus:border-accent"
						/>
					</label>
					{label && (
						<button
							type="button"
							onClick={() => onChange({ start: null, end: null })}
							className="mt-xs w-full text-left text-xs text-text-muted hover:text-accent"
						>
							Clear
						</button>
					)}
				</div>
			)}
		</div>
	);
};

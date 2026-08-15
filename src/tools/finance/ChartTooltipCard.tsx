import React from 'react';

interface ChartTooltipCardProps {
	children: React.ReactNode;
}

/** Consistent chrome for chart hover tooltips, matching the app's popover styling. */
export const ChartTooltipCard = ({ children }: ChartTooltipCardProps): React.ReactElement => (
	<div className="rounded-brand border border-border bg-surface px-sm py-xs text-xs shadow-lg">
		{children}
	</div>
);

interface ChartTooltipRowProps {
	/** Secondary label, e.g. a tag name or date. */
	label: string;
	/** Primary value, already formatted for display (e.g. a currency string). */
	value: string;
	/** Series color swatch shown as a short line key beside the label. */
	swatchColor?: string;
}

/** One label/value row inside a ChartTooltipCard — value leads, label follows, per dataviz guidance. */
export const ChartTooltipRow = ({
	label,
	value,
	swatchColor,
}: ChartTooltipRowProps): React.ReactElement => (
	<div className="flex items-center gap-xs whitespace-nowrap">
		{swatchColor && (
			<span
				aria-hidden="true"
				className="inline-block h-0.5 w-3 shrink-0"
				style={{ backgroundColor: swatchColor }}
			/>
		)}
		<span className="text-text-muted">{label}</span>
		<span className="font-semibold text-text">{value}</span>
	</div>
);

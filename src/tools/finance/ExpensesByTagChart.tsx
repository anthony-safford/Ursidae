import React from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { formatCurrencyAmount } from './expenseModel';
import { OTHER_LABEL, TagTotalT } from './insightsModel';
import { ChartTooltipCard, ChartTooltipRow } from './ChartTooltipCard';

const SERIES_COLOR_TOKENS = [
	'var(--color-series-1)',
	'var(--color-series-2)',
	'var(--color-series-3)',
	'var(--color-series-4)',
	'var(--color-series-5)',
	'var(--color-series-6)',
];

/**
 * Assigns each tag a color slot the first time it's seen and remembers it for the life of
 * the session, so a tag's color stays fixed as filters change which tags are present or how
 * they rank by amount — color follows the entity, never its sort position.
 */
const tagColorSlots = new Map<string, string>();
const colorForTag = (tag: string): string => {
	if (tag === OTHER_LABEL) return 'var(--color-series-other)';
	const existing = tagColorSlots.get(tag);
	if (existing) return existing;
	const color = SERIES_COLOR_TOKENS[tagColorSlots.size % SERIES_COLOR_TOKENS.length];
	tagColorSlots.set(tag, color);
	return color;
};

interface ExpensesByTagChartProps {
	/** Tag totals, already sorted and capped by aggregateByTag. */
	data: TagTotalT[];
	/** Currency the amounts are already converted to, for display formatting. */
	displayCurrency: string;
}

const renderTooltip = (
	displayCurrency: string
): ((props: TooltipContentProps) => React.ReactElement | null) => {
	const TooltipContent = ({ active, payload }: TooltipContentProps): React.ReactElement | null => {
		if (!active || !payload?.length) return null;
		const entry = payload[0];
		const tag = String(entry.name);
		const amount = Number(entry.value ?? 0);

		return (
			<ChartTooltipCard>
				<ChartTooltipRow
					label={tag}
					value={formatCurrencyAmount(amount, displayCurrency)}
					swatchColor={colorForTag(tag)}
				/>
			</ChartTooltipCard>
		);
	};
	return TooltipContent;
};

/** Custom legend: swatch + tag name + formatted amount, so the value is visible without hovering. */
const ExpensesByTagLegend = ({
	data,
	displayCurrency,
}: {
	data: TagTotalT[];
	displayCurrency: string;
}): React.ReactElement => (
	<ul className="flex flex-wrap gap-x-md gap-y-xs pt-sm text-xs">
		{data.map((entry) => (
			<li key={entry.tag} className="flex items-center gap-xs whitespace-nowrap">
				<span
					aria-hidden="true"
					className="inline-block h-2 w-2 shrink-0 rounded-full"
					style={{ backgroundColor: colorForTag(entry.tag) }}
				/>
				<span className="text-text-muted">{entry.tag}</span>
				<span className="font-semibold text-text">
					{formatCurrencyAmount(entry.amountMinorUnits, displayCurrency)}
				</span>
			</li>
		))}
	</ul>
);

/** Expenditure share by tag — a donut chart with a legend (values shown, not color-only). */
export const ExpensesByTagChart = ({
	data,
	displayCurrency,
}: ExpensesByTagChartProps): React.ReactElement => {
	if (data.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-xs text-text-muted">
				No expenses in range.
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<PieChart>
				<Pie
					data={data}
					dataKey="amountMinorUnits"
					nameKey="tag"
					cx="50%"
					cy="50%"
					innerRadius="55%"
					outerRadius="85%"
					stroke="var(--color-surface)"
					strokeWidth={2}
					isAnimationActive
				>
					{data.map((entry) => (
						<Cell key={entry.tag} fill={colorForTag(entry.tag)} />
					))}
				</Pie>
				<Tooltip content={renderTooltip(displayCurrency)} />
				<Legend
					content={() => <ExpensesByTagLegend data={data} displayCurrency={displayCurrency} />}
				/>
			</PieChart>
		</ResponsiveContainer>
	);
};

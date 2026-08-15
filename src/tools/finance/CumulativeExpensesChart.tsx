import React from 'react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { formatCurrencyAmount } from './expenseModel';
import { CumulativeDayTotalT } from './insightsModel';
import { ChartTooltipCard, ChartTooltipRow } from './ChartTooltipCard';

interface CumulativeExpensesChartProps {
	/** Running daily totals, sorted chronologically by cumulativeByDay. */
	data: CumulativeDayTotalT[];
	/** Currency the amounts are already converted to, for display formatting. */
	displayCurrency: string;
}

const formatDayTick = (date: string): string => date.slice(5); // "2024-08-03" -> "08-03"

const renderTooltip = (
	displayCurrency: string
): ((props: TooltipContentProps) => React.ReactElement | null) => {
	const TooltipContent = ({ active, payload }: TooltipContentProps): React.ReactElement | null => {
		if (!active || !payload?.length) return null;
		const entry = payload[0];
		const date = String((entry.payload as CumulativeDayTotalT).date);
		const amount = Number(entry.value ?? 0);

		return (
			<ChartTooltipCard>
				<ChartTooltipRow label={date} value={formatCurrencyAmount(amount, displayCurrency)} />
			</ChartTooltipCard>
		);
	};
	return TooltipContent;
};

/** Cumulative expenditure through the period — a single-series area chart (no legend needed). */
export const CumulativeExpensesChart = ({
	data,
	displayCurrency,
}: CumulativeExpensesChartProps): React.ReactElement => {
	if (data.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-xs text-text-muted">
				No expenses in range.
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
				<CartesianGrid stroke="var(--color-border)" vertical={false} />
				<XAxis
					dataKey="date"
					tickFormatter={formatDayTick}
					stroke="var(--color-border)"
					tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
					tickLine={false}
				/>
				<YAxis
					stroke="var(--color-border)"
					tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
					tickLine={false}
					width={40}
					tickFormatter={(value: number) => formatCurrencyAmount(value, displayCurrency)}
				/>
				<Tooltip
					content={renderTooltip(displayCurrency)}
					cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
				/>
				<Area
					type="monotone"
					dataKey="cumulativeMinorUnits"
					stroke="var(--color-accent)"
					strokeWidth={2}
					fill="var(--color-accent)"
					fillOpacity={0.1}
					dot={{
						r: 4,
						fill: 'var(--color-accent)',
						stroke: 'var(--color-surface)',
						strokeWidth: 2,
					}}
					activeDot={{ r: 5 }}
					isAnimationActive
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
};

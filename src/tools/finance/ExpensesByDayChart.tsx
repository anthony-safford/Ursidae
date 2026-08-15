import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { formatCurrencyAmount } from './expenseModel';
import { DayTotalT } from './insightsModel';
import { ChartTooltipCard, ChartTooltipRow } from './ChartTooltipCard';

interface ExpensesByDayChartProps {
	/** Day totals, sorted chronologically by aggregateByDay. */
	data: DayTotalT[];
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
		const date = String((entry.payload as DayTotalT).date);
		const amount = Number(entry.value ?? 0);

		return (
			<ChartTooltipCard>
				<ChartTooltipRow label={date} value={formatCurrencyAmount(amount, displayCurrency)} />
			</ChartTooltipCard>
		);
	};
	return TooltipContent;
};

/** Expenditure by day — a single-series bar chart (one series, so no legend box needed). */
export const ExpensesByDayChart = ({
	data,
	displayCurrency,
}: ExpensesByDayChartProps): React.ReactElement => {
	if (data.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-xs text-text-muted">
				No expenses in range.
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
					cursor={{ fill: 'var(--color-border)', opacity: 0.5 }}
				/>
				<Bar
					dataKey="amountMinorUnits"
					fill="var(--color-accent)"
					radius={[4, 4, 0, 0]}
					maxBarSize={24}
					isAnimationActive
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};

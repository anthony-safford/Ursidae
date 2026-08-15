import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartTooltipCard, ChartTooltipRow } from '../ChartTooltipCard';

describe('ChartTooltipCard', () => {
	it('renders its children', () => {
		render(
			<ChartTooltipCard>
				<span>content</span>
			</ChartTooltipCard>
		);

		expect(screen.getByText('content')).toBeInTheDocument();
	});
});

describe('ChartTooltipRow', () => {
	it('renders the label and value', () => {
		render(<ChartTooltipRow label="Groceries" value="$54.20" />);

		expect(screen.getByText('Groceries')).toBeInTheDocument();
		expect(screen.getByText('$54.20')).toBeInTheDocument();
	});

	it('omits the swatch when no swatchColor is given', () => {
		const { container } = render(<ChartTooltipRow label="Groceries" value="$54.20" />);

		expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
	});

	it('renders a color swatch when swatchColor is given', () => {
		const { container } = render(
			<ChartTooltipRow label="Groceries" value="$54.20" swatchColor="var(--color-series-1)" />
		);

		const swatch = container.querySelector('[aria-hidden="true"]');
		expect(swatch).toBeInTheDocument();
		expect(swatch).toHaveStyle({ backgroundColor: 'var(--color-series-1)' });
	});
});

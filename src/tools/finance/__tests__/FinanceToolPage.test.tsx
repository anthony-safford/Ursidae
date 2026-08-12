import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FinanceToolPage } from '../FinanceToolPage';

describe('FinanceToolPage', () => {
	it('renders the finance heading, description, and tile grid', () => {
		render(<FinanceToolPage />);

		expect(screen.getByRole('heading', { name: 'Finance' })).toBeInTheDocument();
		expect(screen.getByText(/Track expenses, assets, and liabilities/)).toBeInTheDocument();
		expect(screen.getByText('Assets')).toBeInTheDocument();
		expect(screen.getByText('Liabilities')).toBeInTheDocument();
	});

	it('renders the currency swapper in the toolbar, defaulted to USD', () => {
		render(<FinanceToolPage />);

		expect(screen.getByLabelText('Display currency')).toHaveValue('USD');
	});

	it('renders the global date filter in the toolbar, defaulted to no range', () => {
		render(<FinanceToolPage />);

		expect(screen.getByLabelText('Filter from date')).toHaveValue('');
		expect(screen.getByLabelText('Filter to date')).toHaveValue('');
	});
});

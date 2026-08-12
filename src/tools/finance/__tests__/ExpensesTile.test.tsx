import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ExpensesTile } from '../ExpensesTile';
import { FinanceFiltersProvider } from '../financeFiltersContext';

/** Renders ExpensesTile inside the provider it requires, optionally with a non-default currency. */
const renderExpensesTile = (
	providerProps: { initialCurrency?: string } = {}
): ReturnType<typeof render> =>
	render(
		<FinanceFiltersProvider {...providerProps}>
			<ExpensesTile />
		</FinanceFiltersProvider>
	);

describe('ExpensesTile', () => {
	it('renders initial seeded rows with their dates, amounts, and locations', () => {
		renderExpensesTile();

		// Check Trader Joe's row (ISO date format)
		expect(screen.getByDisplayValue('2024-08-01')).toBeInTheDocument();
		expect(screen.getByDisplayValue('54.20')).toBeInTheDocument();
		expect(screen.getByDisplayValue("Trader Joe's")).toBeInTheDocument();

		// Check Metro Transit row
		expect(screen.getByDisplayValue('2024-08-03')).toBeInTheDocument();
		expect(screen.getByDisplayValue('12.00')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Metro Transit')).toBeInTheDocument();

		// Check Comcast row
		expect(screen.getByDisplayValue('2024-08-05')).toBeInTheDocument();
		expect(screen.getByDisplayValue('89.99')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Comcast')).toBeInTheDocument();
	});

	describe('Amount input sanitization', () => {
		it('sanitizes non-numeric characters from amount input', async () => {
			const user = userEvent.setup();
			renderExpensesTile();

			const amountInputs = screen.getAllByPlaceholderText('0.00');
			const firstAmountInput = amountInputs[0] as HTMLInputElement;

			// Clear and type "abc12.5.6"
			await user.clear(firstAmountInput);
			await user.type(firstAmountInput, 'abc12.5.6');

			// Should sanitize to "12.56" (keeps only digits and first dot)
			expect(firstAmountInput.value).toBe('12.56');
		});

		it('keeps only the first decimal point in amount', async () => {
			const user = userEvent.setup();
			renderExpensesTile();

			const amountInputs = screen.getAllByPlaceholderText('0.00');
			const firstAmountInput = amountInputs[0] as HTMLInputElement;

			await user.clear(firstAmountInput);
			await user.type(firstAmountInput, '99.99.99');

			expect(firstAmountInput.value).toBe('99.9999');
		});

		it('normalizes amount on blur: partial amounts are formatted to two decimal places', async () => {
			const user = userEvent.setup();
			renderExpensesTile();

			const amountInputs = screen.getAllByPlaceholderText('0.00');
			const firstAmountInput = amountInputs[0] as HTMLInputElement;

			// Clear and type a partial amount
			await user.clear(firstAmountInput);
			await user.type(firstAmountInput, '12');

			// Blur to trigger normalization
			await user.click(document.body);

			// Should be formatted to "12.00"
			expect(firstAmountInput.value).toBe('12.00');
		});
	});

	describe('Native date input', () => {
		it('allows setting and changing date via native <input type="date">', () => {
			renderExpensesTile();

			const dateInputs = screen.getAllByDisplayValue(/2024-08/);
			const firstDateInput = dateInputs[0] as HTMLInputElement;

			// Change the date using fireEvent since native date input typing is finicky in jsdom
			fireEvent.change(firstDateInput, { target: { value: '2024-09-15' } });

			// Assert the value changed
			expect(firstDateInput.value).toBe('2024-09-15');
		});
	});

	describe('Row deletion', () => {
		it('clicking "Delete expense" row button removes that row from the table', async () => {
			const user = userEvent.setup();
			renderExpensesTile();

			expect(screen.getByDisplayValue("Trader Joe's")).toBeInTheDocument();

			const deleteButtons = screen.getAllByLabelText('Delete expense');
			await user.click(deleteButtons[0]);

			expect(screen.queryByDisplayValue("Trader Joe's")).not.toBeInTheDocument();
		});
	});

	describe('Column sorting', () => {
		it('clicking a column header toggles sort ascending, then descending, then back to unsorted', async () => {
			const user = userEvent.setup();
			renderExpensesTile();

			const dateHeader = screen.getByRole('button', { name: /date/i });

			// First click: sort ascending (▲)
			await user.click(dateHeader);
			expect(dateHeader.textContent).toContain('▲');

			// Second click: sort descending (▼)
			await user.click(dateHeader);
			expect(dateHeader.textContent).toContain('▼');

			// Third click: unsorted (no indicator)
			await user.click(dateHeader);
			expect(dateHeader.textContent).not.toContain('▲');
			expect(dateHeader.textContent).not.toContain('▼');
		});

		it('clicking "Amount" header sorts rows by amount', async () => {
			const user = userEvent.setup();
			renderExpensesTile();

			const amountHeader = screen.getByRole('button', { name: /amount/i });

			// Click to sort ascending
			await user.click(amountHeader);

			const amountInputs = screen.getAllByPlaceholderText('0.00');
			const visibleAmounts = Array.from(amountInputs)
				.filter((input) => {
					const row = input.closest('tr');
					return row && !row.querySelector('.line-through');
				})
				.map((input) => (input as HTMLInputElement).value);

			// Should be sorted: 12.00, 54.20, 89.99
			expect(visibleAmounts[0]).toBe('12.00');
			expect(visibleAmounts[1]).toBe('54.20');
			expect(visibleAmounts[2]).toBe('89.99');
		});

		it('clicking "Location" header sorts rows by location', async () => {
			const user = userEvent.setup();
			renderExpensesTile();

			const locationHeader = screen.getByRole('button', { name: /location/i });

			// Click to sort ascending
			await user.click(locationHeader);

			const locationInputs = screen.getAllByPlaceholderText('Location');
			const visibleLocations = Array.from(locationInputs)
				.filter((input) => {
					const row = input.closest('tr');
					return row && !row.querySelector('.line-through');
				})
				.map((input) => (input as HTMLInputElement).value);

			// Should be sorted alphabetically: Comcast, Metro Transit, Trader Joe's
			expect(visibleLocations[0]).toBe('Comcast');
			expect(visibleLocations[1]).toBe('Metro Transit');
			expect(visibleLocations[2]).toBe("Trader Joe's");
		});
	});

	describe('Tag management', () => {
		it('adding a tag: click "+ Tag", type a tag name, press Enter, asserts the tag pill appears', async () => {
			const user = userEvent.setup();
			renderExpensesTile();

			// Find the first row's tag section
			const tagButtons = screen.getAllByText('+ Tag');
			await user.click(tagButtons[0]);

			// Type a tag name
			const tagInputs = screen.getAllByPlaceholderText('Tag');
			const firstTagInput = tagInputs[0] as HTMLInputElement;

			await user.type(firstTagInput, 'NewTag');
			await user.keyboard('{Enter}');

			// Tag should appear
			expect(screen.getByText('NewTag')).toBeInTheDocument();
		});

		it('clicking "Remove tag <name>" removes it', async () => {
			const user = userEvent.setup();
			renderExpensesTile();

			// First row already has 'Groceries' tag
			const groceriesTag = screen.getByText('Groceries');
			expect(groceriesTag).toBeInTheDocument();

			// The remove button should be queryable by aria-label
			const removeButton = screen.getByLabelText('Remove tag Groceries');
			expect(removeButton).toBeInTheDocument();

			await user.click(removeButton);

			// Tag should be removed
			expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
		});

		it('the remove tag button is hidden by Tailwind CSS but queryable via getByLabelText before removal', () => {
			renderExpensesTile();

			// Button exists in DOM but is hidden with CSS 'hidden' class
			const removeButton = screen.getByLabelText('Remove tag Groceries');
			expect(removeButton).toBeInTheDocument();
			expect(removeButton.className).toContain('hidden');
		});
	});

	describe('Quick-entry scoped to tile focus', () => {
		it('typing a printable character key when focused inside the tile adds a new row seeded with that character in location field', () => {
			renderExpensesTile();

			const initialLocationInputs = screen.getAllByPlaceholderText('Location');
			const initialCount = initialLocationInputs.length;

			// Find the outermost div (the one with tabIndex and onKeyDown)
			const tileContainer = initialLocationInputs[0]?.closest('[tabindex="0"]') as HTMLElement;
			expect(tileContainer).toBeTruthy();

			// Focus the container and dispatch a keydown event
			tileContainer.focus();
			fireEvent.keyDown(tileContainer, { key: 'a', code: 'KeyA' });

			// A new row should be added
			const newLocationInputs = screen.getAllByPlaceholderText('Location');
			expect(newLocationInputs.length).toBe(initialCount + 1);

			// The new row's location should be seeded with 'a'
			const lastLocationInput = newLocationInputs[newLocationInputs.length - 1] as HTMLInputElement;
			expect(lastLocationInput.value).toBe('a');
		});

		it('typing while focus is outside the tile component does NOT add a new row', () => {
			renderExpensesTile();

			const initialLocationInputs = screen.getAllByPlaceholderText('Location');
			const initialCount = initialLocationInputs.length;

			// Type a key on the document body (outside the tile, with no focus inside component)
			fireEvent.keyDown(document.body, { key: 'a', code: 'KeyA' });

			// No new row should be added
			const newLocationInputs = screen.getAllByPlaceholderText('Location');
			expect(newLocationInputs.length).toBe(initialCount);
		});

		it('does not trigger quick-entry when typing into an already-focused input field', async () => {
			const user = userEvent.setup();
			renderExpensesTile();

			const locationInputs = screen.getAllByPlaceholderText('Location');
			const firstLocationInput = locationInputs[0] as HTMLInputElement;

			// Focus on a location input
			await user.click(firstLocationInput);

			const initialCount = locationInputs.length;

			// Type a letter while focused on the input
			await user.type(firstLocationInput, 'x');

			// No new row should be added; the input just receives the character
			const newLocationInputs = screen.getAllByPlaceholderText('Location');
			expect(newLocationInputs.length).toBe(initialCount);
			expect(firstLocationInput.value).toContain('x');
		});

		it('does not trigger quick-entry when a modifier key is held', () => {
			renderExpensesTile();

			const initialLocationInputs = screen.getAllByPlaceholderText('Location');
			const initialCount = initialLocationInputs.length;

			// Find the container and dispatch a keydown with Ctrl held
			const tileContainer = initialLocationInputs[0]?.closest('[tabindex="0"]') as HTMLElement;
			tileContainer.focus();
			fireEvent.keyDown(tileContainer, { key: 'a', code: 'KeyA', ctrlKey: true });

			// No new row should be added
			const newLocationInputs = screen.getAllByPlaceholderText('Location');
			expect(newLocationInputs.length).toBe(initialCount);
		});
	});

	describe('Add expense button', () => {
		it('clicking "+ Add expense" button adds a new empty row', async () => {
			const user = userEvent.setup();
			renderExpensesTile();

			const addButton = screen.getByRole('button', { name: /\+ Add expense/ });
			const initialLocationInputs = screen.getAllByPlaceholderText('Location');
			const initialCount = initialLocationInputs.length;

			await user.click(addButton);

			const newLocationInputs = screen.getAllByPlaceholderText('Location');
			expect(newLocationInputs.length).toBe(initialCount + 1);
		});
	});

	describe('Currency conversion preview', () => {
		it('shows no converted amount when the display currency matches the row currency (USD default)', () => {
			renderExpensesTile();

			expect(screen.queryByLabelText(/Converted to/)).not.toBeInTheDocument();
		});

		it('shows a converted amount alongside the raw input when the display currency differs', () => {
			renderExpensesTile({ initialCurrency: 'EUR' });

			const converted = screen.getAllByLabelText('Converted to EUR');
			expect(converted.length).toBeGreaterThan(0);
			// 54.20 USD * 0.92 EUR/USD = 49.86 EUR
			expect(converted[0].textContent).toContain('49.86');
		});
	});
});

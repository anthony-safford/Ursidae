import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TileGrid } from '../TileGrid';

describe('TileGrid', () => {
	it('renders one tile per definition', () => {
		render(
			<TileGrid
				tiles={[
					{ id: 'a', title: 'Assets', content: '$482,300' },
					{ id: 'b', title: 'Liabilities', content: '$118,900' },
				]}
			/>
		);

		expect(screen.getByText('Assets')).toBeInTheDocument();
		expect(screen.getByText('$482,300')).toBeInTheDocument();
		expect(screen.getByText('Liabilities')).toBeInTheDocument();
		expect(screen.getByText('$118,900')).toBeInTheDocument();
	});

	describe('Delete mode', () => {
		it('clicking "Delete tiles" button turns on delete mode and it STAYS on immediately after that single click', async () => {
			const user = userEvent.setup();
			render(
				<TileGrid
					tiles={[
						{ id: 'a', title: 'Assets', content: '$482,300' },
						{ id: 'b', title: 'Liabilities', content: '$118,900' },
					]}
				/>
			);

			const deleteButton = screen.getByRole('button', { name: /delete tiles/i });
			expect(deleteButton).toHaveAttribute('aria-pressed', 'false');

			await user.click(deleteButton);

			// The delete mode should stay on immediately after the single click.
			expect(deleteButton).toHaveAttribute('aria-pressed', 'true');
		});

		it('each tile should expose an accessible way to delete just that tile via getByRole', async () => {
			const user = userEvent.setup();
			render(
				<TileGrid
					tiles={[
						{ id: 'a', title: 'Assets', content: '$482,300' },
						{ id: 'b', title: 'Liabilities', content: '$118,900' },
					]}
				/>
			);

			const deleteButton = screen.getByRole('button', { name: /delete tiles/i });
			await user.click(deleteButton);

			expect(screen.getByRole('button', { name: /delete.*assets/i })).toBeInTheDocument();
		});

		it('clicking a tile in delete mode removes it after animation completes', async () => {
			const user = userEvent.setup();
			render(
				<TileGrid
					tiles={[
						{ id: 'a', title: 'Assets', content: '$482,300' },
						{ id: 'b', title: 'Liabilities', content: '$118,900' },
					]}
				/>
			);

			// Enter delete mode
			const deleteButton = screen.getByRole('button', { name: /delete tiles/i });
			await user.click(deleteButton);

			// Click the delete button for Assets tile
			const assetsDeleteButton = screen.getByRole('button', { name: /delete.*assets/i });
			await user.click(assetsDeleteButton);

			// Wait for animation to complete (200ms)
			await waitFor(
				() => {
					expect(screen.queryByText('Assets')).not.toBeInTheDocument();
				},
				{ timeout: 500 }
			);
		});

		it('pressing Escape while in delete mode turns delete mode back off', async () => {
			const user = userEvent.setup();
			render(<TileGrid tiles={[{ id: 'a', title: 'Assets', content: '$482,300' }]} />);

			const deleteButton = screen.getByRole('button', { name: /delete tiles/i });
			await user.click(deleteButton);
			expect(deleteButton).toHaveAttribute('aria-pressed', 'true');

			await user.keyboard('{Escape}');

			expect(deleteButton).toHaveAttribute('aria-pressed', 'false');
		});

		it('clicking outside all tiles while in delete mode exits delete mode', async () => {
			const user = userEvent.setup();
			render(
				<TileGrid
					tiles={[
						{ id: 'a', title: 'Assets', content: '$482,300' },
						{ id: 'b', title: 'Liabilities', content: '$118,900' },
					]}
				/>
			);

			const deleteButton = screen.getByRole('button', { name: /delete tiles/i });
			await user.click(deleteButton);
			expect(deleteButton).toHaveAttribute('aria-pressed', 'true');

			// Click on an element that's outside the grid container
			// Use document.body to simulate a click far away
			await user.click(document.body);

			// This click should exit delete mode
			await waitFor(() => {
				expect(deleteButton).toHaveAttribute('aria-pressed', 'false');
			});
		});
	});

	describe('Add tile', () => {
		it('Add tile is disabled when all catalog tiles are active', () => {
			render(<TileGrid tiles={[{ id: 'a', title: 'Assets', content: '$482,300' }]} />);

			const addButton = screen.getByRole('button', { name: /add tile/i });
			expect(addButton).toHaveAttribute('disabled');
			expect(addButton).toHaveAttribute('aria-disabled', 'true');
		});

		it('clicking "Add tile" opens a menu of inactive tiles, and clicking a menu item reactivates that tile', async () => {
			const user = userEvent.setup();
			render(
				<TileGrid
					tiles={[
						{ id: 'a', title: 'Assets', content: '$482,300' },
						{ id: 'b', title: 'Liabilities', content: '$118,900' },
					]}
				/>
			);

			// Verify both tiles are initially present
			expect(screen.getByText('Assets')).toBeInTheDocument();
			expect(screen.getByText('Liabilities')).toBeInTheDocument();

			// Enter delete mode and delete the Liabilities tile
			const deleteButton = screen.getByRole('button', { name: /delete tiles/i });
			await user.click(deleteButton);

			const liabilitiesDeleteButton = screen.getByRole('button', { name: /delete.*liabilities/i });
			await user.click(liabilitiesDeleteButton);

			// Wait for animation to complete
			await waitFor(
				() => {
					expect(screen.queryByText('Liabilities')).not.toBeInTheDocument();
				},
				{ timeout: 500 }
			);

			// Exit delete mode
			await user.click(deleteButton);

			// Click "Add tile" to open the menu
			const addButton = screen.getByRole('button', { name: /add tile/i });
			expect(addButton).not.toHaveAttribute('disabled');
			await user.click(addButton);

			// The menu should show "Liabilities" as an option
			const liabilitiesMenuItem = screen.getByRole('button', { name: 'Liabilities' });
			expect(liabilitiesMenuItem).toBeInTheDocument();

			// Click to reactivate
			await user.click(liabilitiesMenuItem);

			// Liabilities should reappear in the document
			expect(screen.getByText('Liabilities')).toBeInTheDocument();
			expect(screen.getByText('$118,900')).toBeInTheDocument();
		});
	});
});

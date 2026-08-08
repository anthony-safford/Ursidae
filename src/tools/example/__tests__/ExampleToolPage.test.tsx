import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { ExampleToolPage } from '../ExampleToolPage';

describe('ExampleToolPage', () => {
	it('renders the example tool heading and updated description', () => {
		render(<ExampleToolPage />);

		expect(screen.getByRole('heading', { name: 'Example Tool' })).toBeInTheDocument();
		expect(
			screen.getByText(
				'This is an example tool demonstrating code-split routing and database integration.'
			)
		).toBeInTheDocument();
	});

	it('fetches the counter and displays the initial count after loading resolves', async () => {
		// Use a fresh handler closure for this test
		server.use(
			http.get('/api/example/counter', () => {
				return HttpResponse.json({ count: 0 });
			})
		);

		render(<ExampleToolPage />);

		// Initially shows "Loading..."
		expect(screen.getByText('Loading...')).toBeInTheDocument();

		// After fetch resolves, displays "Count: 0"
		await waitFor(() => {
			expect(screen.getByText(/Count:/)).toBeInTheDocument();
		});

		const countDisplay = screen.getByText('0');
		expect(countDisplay).toBeInTheDocument();
	});

	it('clicking the Increment button updates the displayed count', async () => {
		const user = userEvent.setup();
		let counterValue = 0;

		// Use fresh handler closures for this test
		server.use(
			http.get('/api/example/counter', () => {
				return HttpResponse.json({ count: counterValue });
			}),
			http.post('/api/example/counter/increment', () => {
				counterValue += 1;
				return HttpResponse.json({ count: counterValue });
			})
		);

		render(<ExampleToolPage />);

		// Wait for initial load
		await waitFor(() => {
			expect(screen.getByText(/Count:/)).toBeInTheDocument();
		});

		// Verify initial count is 0
		expect(screen.getByText('0')).toBeInTheDocument();

		// Click the Increment button
		const incrementButton = screen.getByRole('button', { name: 'Increment' });
		await user.click(incrementButton);

		// Verify count updates to 1
		await waitFor(() => {
			expect(screen.getByText('1')).toBeInTheDocument();
		});
	});
});

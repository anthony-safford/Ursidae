import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { TasksToolPage } from '../TasksToolPage';

describe('TasksToolPage', () => {
	it('renders the tasks heading and description', () => {
		render(<TasksToolPage />);

		expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
	});

	it('shows a loading state and then an empty state when there are no tasks', async () => {
		server.use(
			http.get('/api/tasks', () => {
				return HttpResponse.json([]);
			})
		);

		render(<TasksToolPage />);

		expect(screen.getByText('Loading...')).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText('No tasks yet.')).toBeInTheDocument();
		});
	});

	it('renders fetched tasks with their title, status, and description', async () => {
		server.use(
			http.get('/api/tasks', () => {
				return HttpResponse.json([
					{
						id: 1,
						parentId: null,
						title: 'Write the report',
						description: 'Cover Q3 numbers',
						questions: null,
						status: 'open',
						positionX: 0,
						positionY: 0,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			})
		);

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByText('Write the report')).toBeInTheDocument();
		});

		expect(screen.getByText('Cover Q3 numbers')).toBeInTheDocument();
		expect(screen.getByText('open')).toBeInTheDocument();
	});
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { TasksToolPage } from '../TasksToolPage';

const existingTask = {
	id: 1,
	parentId: null,
	title: 'Write the report',
	description: 'Cover Q3 numbers',
	questions: null,
	status: 'open' as const,
	positionX: 0,
	positionY: 0,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

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
		server.use(http.get('/api/tasks', () => HttpResponse.json([existingTask])));

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByText('Write the report')).toBeInTheDocument();
		});

		expect(screen.getByText('Cover Q3 numbers')).toBeInTheDocument();
		expect(screen.getByText('Open')).toBeInTheDocument();
	});

	it('creates a task via the Add Task panel and renders it on the canvas', async () => {
		const user = userEvent.setup();
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([])),
			http.post('/api/tasks', async ({ request }) => {
				const body = (await request.json()) as { title: string };
				return HttpResponse.json(
					{ ...existingTask, id: 2, title: body.title, description: null },
					{ status: 201 }
				);
			})
		);

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Add Task' })).toBeInTheDocument();
		});

		await user.click(screen.getByRole('button', { name: 'Add Task' }));
		await user.type(screen.getByLabelText('Title'), 'Plan the launch');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => {
			expect(screen.getByText('Plan the launch')).toBeInTheDocument();
		});
	});

	it('edits a task via its card and reflects the change on the canvas', async () => {
		const user = userEvent.setup();
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([existingTask])),
			http.patch('/api/tasks/1', () =>
				HttpResponse.json({ ...existingTask, title: 'Write the final report' })
			)
		);

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByText('Write the report')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText('Write the report'));

		const titleInput = await screen.findByLabelText('Title');
		expect(titleInput).toHaveValue('Write the report');

		await user.clear(titleInput);
		await user.type(titleInput, 'Write the final report');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => {
			expect(screen.getByText('Write the final report')).toBeInTheDocument();
		});
	});

	it('deletes a task via its card and removes it from the canvas', async () => {
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([existingTask])),
			http.delete('/api/tasks/1', () => new HttpResponse(null, { status: 204 }))
		);

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByText('Write the report')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId('delete-task-1'));

		await waitFor(() => {
			expect(screen.getByText('No tasks yet.')).toBeInTheDocument();
		});
	});
});

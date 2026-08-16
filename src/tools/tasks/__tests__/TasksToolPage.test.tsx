import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { TasksToolPage } from '../TasksToolPage';

const existingTask = {
	id: 1,
	parentId: null,
	title: 'Write the report',
	description: 'Cover Q3 numbers',
	status: 'discovery' as const,
	positionX: 0,
	positionY: 0,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

beforeEach(() => {
	// Default: no questions/links unless a test overrides them. TasksToolPage always fetches all three on mount.
	server.use(
		http.get('/api/tasks/questions', () => HttpResponse.json([])),
		http.get('/api/tasks/links', () => HttpResponse.json([]))
	);
});

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

	it('renders fetched tasks with editable title/description and their status', async () => {
		server.use(http.get('/api/tasks', () => HttpResponse.json([existingTask])));

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByLabelText('Title for Write the report')).toHaveValue('Write the report');
		});

		expect(screen.getByLabelText('Description for Write the report')).toHaveValue(
			'Cover Q3 numbers'
		);
		expect(screen.getByLabelText('Status for Write the report')).toHaveValue('discovery');
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
			expect(screen.getByDisplayValue('Plan the launch')).toBeInTheDocument();
		});
	});

	it('closes the Add Task panel via Cancel without creating a task', async () => {
		const user = userEvent.setup();
		server.use(http.get('/api/tasks', () => HttpResponse.json([])));

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Add Task' })).toBeInTheDocument();
		});

		await user.click(screen.getByRole('button', { name: 'Add Task' }));
		expect(screen.getByRole('heading', { name: 'Add Task' })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(screen.queryByRole('heading', { name: 'Add Task' })).not.toBeInTheDocument();
		expect(screen.getByText('No tasks yet.')).toBeInTheDocument();
	});

	it('logs an error when adding a question fails', async () => {
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([existingTask])),
			http.post('/api/tasks/questions', () => HttpResponse.error())
		);
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		render(<TasksToolPage />);

		const input = await screen.findByLabelText('Add a question to Write the report');
		fireEvent.change(input, { target: { value: 'Who owns the budget?' } });
		fireEvent.click(screen.getByTestId('add-question-1'));

		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
		expect(screen.queryByText('Who owns the budget?')).not.toBeInTheDocument();
		consoleErrorSpy.mockRestore();
	});

	it('logs an error when deleting a question fails', async () => {
		const existingQuestion = {
			id: 1,
			taskId: 1,
			text: 'Who owns the budget?',
			createdAt: new Date().toISOString(),
		};
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([existingTask])),
			http.get('/api/tasks/questions', () => HttpResponse.json([existingQuestion])),
			http.delete('/api/tasks/questions/1', () => HttpResponse.error())
		);
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		render(<TasksToolPage />);

		await screen.findByText('Who owns the budget?');
		fireEvent.click(screen.getByTestId('delete-question-1'));

		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
		consoleErrorSpy.mockRestore();
	});

	it('edits a task inline on its card and reflects the change on the canvas', async () => {
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([existingTask])),
			http.patch('/api/tasks/1', () =>
				HttpResponse.json({ ...existingTask, title: 'Write the final report' })
			)
		);

		render(<TasksToolPage />);

		const titleInput = await screen.findByLabelText('Title for Write the report');
		expect(titleInput).toHaveValue('Write the report');

		fireEvent.change(titleInput, { target: { value: 'Write the final report' } });
		fireEvent.blur(titleInput);

		await waitFor(() => {
			expect(screen.getByDisplayValue('Write the final report')).toBeInTheDocument();
		});
	});

	it("creates a sub-task via a parent card's add-sub-task control and renders it on the canvas", async () => {
		const user = userEvent.setup();
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([existingTask])),
			http.post('/api/tasks', async ({ request }) => {
				const body = (await request.json()) as { title: string; parentId?: number };
				return HttpResponse.json(
					{ ...existingTask, id: 2, title: body.title, parentId: body.parentId ?? null },
					{ status: 201 }
				);
			})
		);

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByTestId('add-subtask-1')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId('add-subtask-1'));

		expect(screen.getByRole('heading', { name: 'Add Sub-task' })).toBeInTheDocument();

		await user.type(screen.getByLabelText('Title'), 'Draft the outline');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => {
			expect(screen.getByDisplayValue('Draft the outline')).toBeInTheDocument();
		});
	});

	it('adds a question to a task via its card and renders it as a removable card', async () => {
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([existingTask])),
			http.post('/api/tasks/questions', async ({ request }) => {
				const body = (await request.json()) as { taskId: number; text: string };
				return HttpResponse.json(
					{ id: 1, taskId: body.taskId, text: body.text, createdAt: new Date().toISOString() },
					{ status: 201 }
				);
			})
		);

		render(<TasksToolPage />);

		const input = await screen.findByLabelText('Add a question to Write the report');
		fireEvent.change(input, { target: { value: 'Who owns the budget?' } });
		fireEvent.click(screen.getByTestId('add-question-1'));

		await waitFor(() => {
			expect(screen.getByText('Who owns the budget?')).toBeInTheDocument();
		});
	});

	it('removes a question from a task via its remove button', async () => {
		const existingQuestion = {
			id: 1,
			taskId: 1,
			text: 'Who owns the budget?',
			createdAt: new Date().toISOString(),
		};
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([existingTask])),
			http.get('/api/tasks/questions', () => HttpResponse.json([existingQuestion])),
			http.delete('/api/tasks/questions/1', () => new HttpResponse(null, { status: 204 }))
		);

		render(<TasksToolPage />);

		await screen.findByText('Who owns the budget?');
		fireEvent.click(screen.getByTestId('delete-question-1'));

		await waitFor(() => {
			expect(screen.queryByText('Who owns the budget?')).not.toBeInTheDocument();
		});
	});

	// Link edges (and their delete buttons) never actually render under this project's jsdom
	// ResizeObserver mock — React Flow only draws an edge once it's measured both endpoint nodes.
	// LinkEdge.test.tsx covers the delete button directly instead; link creation/deletion/cascade
	// are verified manually in the browser (see the PR/session notes for the walkthrough).

	it('deletes a parent task, and its sub-task and questions disappear from the canvas immediately', async () => {
		const childTask = { ...existingTask, id: 2, parentId: 1, title: 'Draft the outline' };
		const parentQuestion = {
			id: 1,
			taskId: 1,
			text: 'Who owns the budget?',
			createdAt: new Date().toISOString(),
		};
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([existingTask, childTask])),
			http.get('/api/tasks/questions', () => HttpResponse.json([parentQuestion])),
			http.delete('/api/tasks/1', () => new HttpResponse(null, { status: 204 }))
		);

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByDisplayValue('Draft the outline')).toBeInTheDocument();
		});
		expect(screen.getByText('Who owns the budget?')).toBeInTheDocument();

		fireEvent.click(screen.getByTestId('delete-task-1'));
		fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

		await waitFor(() => {
			expect(screen.getByText('No tasks yet.')).toBeInTheDocument();
		});
		expect(screen.queryByDisplayValue('Draft the outline')).not.toBeInTheDocument();
		expect(screen.queryByText('Who owns the budget?')).not.toBeInTheDocument();
	});

	it('deletes a task via its card and removes it from the canvas', async () => {
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([existingTask])),
			http.delete('/api/tasks/1', () => new HttpResponse(null, { status: 204 }))
		);

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByLabelText('Title for Write the report')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId('delete-task-1'));
		fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

		await waitFor(() => {
			expect(screen.getByText('No tasks yet.')).toBeInTheDocument();
		});
	});

	it('asks for confirmation before deleting a task, and cancels without deleting', async () => {
		server.use(http.get('/api/tasks', () => HttpResponse.json([existingTask])));

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByLabelText('Title for Write the report')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId('delete-task-1'));
		expect(screen.getByRole('heading', { name: 'Delete task?' })).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(screen.queryByRole('heading', { name: 'Delete task?' })).not.toBeInTheDocument();
		expect(screen.getByLabelText('Title for Write the report')).toBeInTheDocument();
	});

	it('shows an error banner and restores the task when deletion fails', async () => {
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([existingTask])),
			http.delete('/api/tasks/1', () =>
				HttpResponse.json({ error: { message: 'Task is referenced elsewhere' } }, { status: 400 })
			)
		);
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByLabelText('Title for Write the report')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId('delete-task-1'));
		fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

		await waitFor(() => {
			expect(screen.getByRole('alert')).toHaveTextContent('Task is referenced elsewhere');
		});
		expect(screen.getByLabelText('Title for Write the report')).toBeInTheDocument();
		consoleErrorSpy.mockRestore();
	});

	it('dismisses the error banner when its dismiss button is clicked', async () => {
		server.use(
			http.get('/api/tasks', () => HttpResponse.json([existingTask])),
			http.delete('/api/tasks/1', () => HttpResponse.error())
		);
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByLabelText('Title for Write the report')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId('delete-task-1'));
		fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

		await screen.findByRole('alert');
		fireEvent.click(screen.getByRole('button', { name: 'Dismiss error' }));

		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		consoleErrorSpy.mockRestore();
	});

	it('shows an empty-state call-to-action that opens the Add Task panel', async () => {
		server.use(http.get('/api/tasks', () => HttpResponse.json([])));

		render(<TasksToolPage />);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Add your first task' })).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: 'Add your first task' }));

		expect(screen.getByRole('heading', { name: 'Add Task' })).toBeInTheDocument();
	});
});

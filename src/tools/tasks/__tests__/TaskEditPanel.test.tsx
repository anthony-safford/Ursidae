import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { TaskEditPanel } from '../TaskEditPanel';
import type { TaskT } from '../tasksModel';

const createdTask: TaskT = {
	id: 2,
	parentId: null,
	title: 'New task',
	description: null,
	status: 'discovery',
	positionX: 0,
	positionY: 0,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

describe('TaskEditPanel', () => {
	it('renders "Add Task" with empty fields', () => {
		render(<TaskEditPanel onSaved={vi.fn()} onClose={vi.fn()} onError={vi.fn()} />);

		expect(screen.getByRole('heading', { name: 'Add Task' })).toBeInTheDocument();
		expect(screen.getByLabelText('Title')).toHaveValue('');
	});

	it('POSTs a new task on submit and calls onSaved', async () => {
		const user = userEvent.setup();
		let capturedBody: unknown;
		server.use(
			http.post('/api/tasks', async ({ request }) => {
				capturedBody = await request.json();
				return HttpResponse.json(createdTask, { status: 201 });
			})
		);

		const onSaved = vi.fn();
		render(<TaskEditPanel onSaved={onSaved} onClose={vi.fn()} onError={vi.fn()} />);

		await user.type(screen.getByLabelText('Title'), 'New task');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => {
			expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 2, title: 'New task' }));
		});
		expect(capturedBody).toEqual(
			expect.objectContaining({
				title: 'New task',
				status: 'discovery',
				description: null,
			})
		);
	});

	it('includes description and status edits in the POST payload', async () => {
		const user = userEvent.setup();
		let capturedBody: unknown;
		server.use(
			http.post('/api/tasks', async ({ request }) => {
				capturedBody = await request.json();
				return HttpResponse.json(createdTask, { status: 201 });
			})
		);

		render(<TaskEditPanel onSaved={vi.fn()} onClose={vi.fn()} onError={vi.fn()} />);

		await user.type(screen.getByLabelText('Title'), 'New task');
		await user.type(screen.getByLabelText('Description'), 'Some details');
		await user.selectOptions(screen.getByLabelText('Status'), 'research');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => {
			expect(capturedBody).toEqual(
				expect.objectContaining({ description: 'Some details', status: 'research' })
			);
		});
	});

	it('logs, calls onError, and does not throw when the POST request fails', async () => {
		const user = userEvent.setup();
		server.use(http.post('/api/tasks', () => HttpResponse.error()));
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		const onSaved = vi.fn();
		const onError = vi.fn();
		render(<TaskEditPanel onSaved={onSaved} onClose={vi.fn()} onError={onError} />);

		await user.type(screen.getByLabelText('Title'), 'New task');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
		expect(onSaved).not.toHaveBeenCalled();
		expect(onError).toHaveBeenCalledWith(expect.any(String));
		consoleErrorSpy.mockRestore();
	});

	it('calls onError with the API-provided message when creation is rejected', async () => {
		const user = userEvent.setup();
		server.use(
			http.post('/api/tasks', () =>
				HttpResponse.json(
					{ error: { code: 'VALIDATION_ERROR', message: 'title is required' } },
					{ status: 400 }
				)
			)
		);
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		const onError = vi.fn();
		render(<TaskEditPanel onSaved={vi.fn()} onClose={vi.fn()} onError={onError} />);

		await user.type(screen.getByLabelText('Title'), 'New task');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith('title is required');
		});
		consoleErrorSpy.mockRestore();
	});

	it('falls back to a generic message when the rejection is not an Error', async () => {
		const user = userEvent.setup();
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce('connection reset');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		const onError = vi.fn();
		render(<TaskEditPanel onSaved={vi.fn()} onClose={vi.fn()} onError={onError} />);

		await user.type(screen.getByLabelText('Title'), 'New task');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith('Failed to save the task.');
		});
		fetchSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	it('does not submit when the title is blank, even if submitted directly', () => {
		const onSaved = vi.fn();
		const { container } = render(
			<TaskEditPanel onSaved={onSaved} onClose={vi.fn()} onError={vi.fn()} />
		);

		const form = container.querySelector('form');
		if (form) fireEvent.submit(form);

		expect(onSaved).not.toHaveBeenCalled();
	});

	it('renders "Add Sub-task" and includes parentId/position when creating with a parentId', async () => {
		const user = userEvent.setup();
		let capturedBody: unknown;
		server.use(
			http.post('/api/tasks', async ({ request }) => {
				capturedBody = await request.json();
				return HttpResponse.json(
					{ ...createdTask, id: 3, parentId: 1, title: 'Sub-task' },
					{ status: 201 }
				);
			})
		);

		render(
			<TaskEditPanel
				parentId={1}
				initialPosition={{ x: 40, y: 80 }}
				onSaved={vi.fn()}
				onClose={vi.fn()}
				onError={vi.fn()}
			/>
		);

		expect(screen.getByRole('heading', { name: 'Add Sub-task' })).toBeInTheDocument();

		await user.type(screen.getByLabelText('Title'), 'Sub-task');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => {
			expect(capturedBody).toEqual(
				expect.objectContaining({ parentId: 1, positionX: 40, positionY: 80 })
			);
		});
	});

	it('calls onClose when Cancel is clicked', async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(<TaskEditPanel onSaved={vi.fn()} onClose={onClose} onError={vi.fn()} />);

		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(onClose).toHaveBeenCalled();
	});

	it('disables the Save button when the title is empty', () => {
		render(<TaskEditPanel onSaved={vi.fn()} onClose={vi.fn()} onError={vi.fn()} />);

		expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
	});
});

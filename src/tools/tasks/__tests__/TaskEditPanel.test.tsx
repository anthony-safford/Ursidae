import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { TaskEditPanel } from '../TaskEditPanel';
import type { TaskT } from '../tasksModel';

const existingTask: TaskT = {
	id: 1,
	parentId: null,
	title: 'Write the report',
	description: 'Cover Q3 numbers',
	questions: 'Which currency?',
	status: 'open',
	positionX: 0,
	positionY: 0,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

describe('TaskEditPanel', () => {
	it('renders "Add Task" with empty fields in create mode', () => {
		render(<TaskEditPanel onSaved={vi.fn()} onClose={vi.fn()} />);

		expect(screen.getByRole('heading', { name: 'Add Task' })).toBeInTheDocument();
		expect(screen.getByLabelText('Title')).toHaveValue('');
	});

	it('renders "Edit Task" pre-filled with the task\'s fields in edit mode', () => {
		render(<TaskEditPanel task={existingTask} onSaved={vi.fn()} onClose={vi.fn()} />);

		expect(screen.getByRole('heading', { name: 'Edit Task' })).toBeInTheDocument();
		expect(screen.getByLabelText('Title')).toHaveValue('Write the report');
		expect(screen.getByLabelText('Description')).toHaveValue('Cover Q3 numbers');
		expect(screen.getByLabelText('Questions')).toHaveValue('Which currency?');
	});

	it('POSTs a new task on submit in create mode and calls onSaved', async () => {
		const user = userEvent.setup();
		let capturedBody: unknown;
		server.use(
			http.post('/api/tasks', async ({ request }) => {
				capturedBody = await request.json();
				return HttpResponse.json({ ...existingTask, id: 2, title: 'New task' }, { status: 201 });
			})
		);

		const onSaved = vi.fn();
		render(<TaskEditPanel onSaved={onSaved} onClose={vi.fn()} />);

		await user.type(screen.getByLabelText('Title'), 'New task');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => {
			expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 2, title: 'New task' }));
		});
		expect(capturedBody).toEqual(
			expect.objectContaining({
				title: 'New task',
				status: 'open',
				description: null,
				questions: null,
			})
		);
	});

	it('PATCHes the task on submit in edit mode and calls onSaved', async () => {
		const user = userEvent.setup();
		let capturedBody: unknown;
		server.use(
			http.patch('/api/tasks/1', async ({ request }) => {
				capturedBody = await request.json();
				return HttpResponse.json({ ...existingTask, status: 'done' });
			})
		);

		const onSaved = vi.fn();
		render(<TaskEditPanel task={existingTask} onSaved={onSaved} onClose={vi.fn()} />);

		await user.selectOptions(screen.getByLabelText('Status'), 'done');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => {
			expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ status: 'done' }));
		});
		expect(capturedBody).toEqual(expect.objectContaining({ status: 'done' }));
	});

	it('renders "Add Sub-task" and includes parentId/position when creating with a parentId', async () => {
		const user = userEvent.setup();
		let capturedBody: unknown;
		server.use(
			http.post('/api/tasks', async ({ request }) => {
				capturedBody = await request.json();
				return HttpResponse.json(
					{ ...existingTask, id: 3, parentId: 1, title: 'Sub-task' },
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
		render(<TaskEditPanel onSaved={vi.fn()} onClose={onClose} />);

		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(onClose).toHaveBeenCalled();
	});

	it('disables the Save button when the title is empty', () => {
		render(<TaskEditPanel onSaved={vi.fn()} onClose={vi.fn()} />);

		expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
	});
});

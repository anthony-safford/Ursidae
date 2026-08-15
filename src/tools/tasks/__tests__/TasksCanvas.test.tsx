import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { TasksCanvas, tasksToNodes, tasksToEdges, persistTaskPosition } from '../TasksCanvas';
import type { TaskT } from '../tasksModel';

const baseTask: TaskT = {
	id: 1,
	parentId: null,
	title: 'Write the report',
	description: 'Cover Q3 numbers',
	questions: null,
	status: 'open',
	positionX: 10,
	positionY: 20,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

const subtask: TaskT = {
	...baseTask,
	id: 2,
	parentId: 1,
	title: 'Draft the outline',
	description: null,
};

describe('tasksToNodes', () => {
	it('maps each task to a positioned "task" node carrying the task, onDelete, and onAddSubtask as data', () => {
		const onDelete = vi.fn();
		const onAddSubtask = vi.fn();
		const nodes = tasksToNodes([baseTask], onDelete, onAddSubtask);

		expect(nodes).toEqual([
			{
				id: '1',
				type: 'task',
				position: { x: 10, y: 20 },
				data: { task: baseTask, onDelete, onAddSubtask },
			},
		]);
	});
});

describe('tasksToEdges', () => {
	it('returns no edges when no task has a parentId', () => {
		expect(tasksToEdges([baseTask])).toEqual([]);
	});

	it('emits a hierarchy edge from parent to child for each sub-task', () => {
		const edges = tasksToEdges([baseTask, subtask]);

		expect(edges).toEqual([
			expect.objectContaining({ id: 'hierarchy-1-2', source: '1', target: '2' }),
		]);
	});
});

describe('persistTaskPosition', () => {
	it('PATCHes the new position and calls onTaskUpdated with the response', async () => {
		let capturedBody: unknown;
		server.use(
			http.patch('/api/tasks/1', async ({ request }) => {
				capturedBody = await request.json();
				return HttpResponse.json({ ...baseTask, positionX: 120, positionY: 45 });
			})
		);

		const onTaskUpdated = vi.fn();
		await persistTaskPosition({ id: '1', position: { x: 120, y: 45 } }, onTaskUpdated);

		expect(capturedBody).toEqual({ positionX: 120, positionY: 45 });
		expect(onTaskUpdated).toHaveBeenCalledWith(
			expect.objectContaining({ positionX: 120, positionY: 45 })
		);
	});

	it('logs and does not throw when the PATCH request fails', async () => {
		server.use(http.patch('/api/tasks/1', () => HttpResponse.error()));
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		const onTaskUpdated = vi.fn();
		await expect(
			persistTaskPosition({ id: '1', position: { x: 0, y: 0 } }, onTaskUpdated)
		).resolves.toBeUndefined();

		expect(onTaskUpdated).not.toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalled();
		consoleErrorSpy.mockRestore();
	});
});

describe('TasksCanvas', () => {
	it('renders a card per task with its title, status, and description', () => {
		render(
			<TasksCanvas
				tasks={[baseTask]}
				onTaskUpdated={vi.fn()}
				onEditTask={vi.fn()}
				onDeleteTask={vi.fn()}
				onAddSubtask={vi.fn()}
			/>
		);

		expect(screen.getByText('Write the report')).toBeInTheDocument();
		expect(screen.getByText('Open')).toBeInTheDocument();
		expect(screen.getByText('Cover Q3 numbers')).toBeInTheDocument();
	});

	it('calls onEditTask with the task id when a card is clicked', () => {
		// Uses fireEvent (a plain "click") rather than userEvent, whose full
		// mousedown+mouseup sequence trips React Flow's d3-drag mousedown handler in jsdom.
		const onEditTask = vi.fn();

		render(
			<TasksCanvas
				tasks={[baseTask]}
				onTaskUpdated={vi.fn()}
				onEditTask={onEditTask}
				onDeleteTask={vi.fn()}
				onAddSubtask={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByText('Write the report'));

		expect(onEditTask).toHaveBeenCalledWith(1);
	});

	it("calls onDeleteTask (not onEditTask) when a card's delete button is clicked", () => {
		// Uses fireEvent + a data-testid rather than a role/name query: React Flow keeps
		// nodes at `visibility: hidden` until its own (unmockable-in-jsdom) resize/zoom
		// measurement pipeline resolves, which the accessibility-tree-based role query
		// respects even though the button is present and perfectly clickable.
		const onEditTask = vi.fn();
		const onDeleteTask = vi.fn();

		render(
			<TasksCanvas
				tasks={[baseTask]}
				onTaskUpdated={vi.fn()}
				onEditTask={onEditTask}
				onDeleteTask={onDeleteTask}
				onAddSubtask={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByTestId('delete-task-1'));

		expect(onDeleteTask).toHaveBeenCalledWith(1);
		expect(onEditTask).not.toHaveBeenCalled();
	});

	it("calls onAddSubtask with the parent id when a top-level card's add-sub-task button is clicked", () => {
		const onAddSubtask = vi.fn();

		render(
			<TasksCanvas
				tasks={[baseTask]}
				onTaskUpdated={vi.fn()}
				onEditTask={vi.fn()}
				onDeleteTask={vi.fn()}
				onAddSubtask={onAddSubtask}
			/>
		);

		fireEvent.click(screen.getByTestId('add-subtask-1'));

		expect(onAddSubtask).toHaveBeenCalledWith(1);
	});

	it('does not render an add-sub-task button on a sub-task card', () => {
		render(
			<TasksCanvas
				tasks={[baseTask, subtask]}
				onTaskUpdated={vi.fn()}
				onEditTask={vi.fn()}
				onDeleteTask={vi.fn()}
				onAddSubtask={vi.fn()}
			/>
		);

		expect(screen.getByTestId('add-subtask-1')).toBeInTheDocument();
		expect(screen.queryByTestId('add-subtask-2')).not.toBeInTheDocument();
	});
});

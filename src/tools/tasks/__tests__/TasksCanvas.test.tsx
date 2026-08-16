import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import {
	TasksCanvas,
	tasksToNodes,
	tasksToEdges,
	linksToEdges,
	persistTaskPosition,
	isValidLinkConnection,
	resolveConfirmedLink,
} from '../TasksCanvas';
import { TASK_DRAG_HANDLE_CLASS } from '../TaskNode';
import type { TaskLinkT, TaskLinkTypeT, TaskQuestionT, TaskT } from '../tasksModel';

const baseTask: TaskT = {
	id: 1,
	parentId: null,
	title: 'Write the report',
	description: 'Cover Q3 numbers',
	status: 'discovery',
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

const question: TaskQuestionT = {
	id: 1,
	taskId: 1,
	text: 'Who owns the budget?',
	createdAt: new Date().toISOString(),
};

const link: TaskLinkT = {
	id: 1,
	sourceTaskId: 1,
	targetTaskId: 2,
	type: 'blocks',
	createdAt: new Date().toISOString(),
};

const noop = (): void => {
	/* no-op */
};

interface RenderCanvasOverridesT {
	tasks?: TaskT[];
	questions?: TaskQuestionT[];
	links?: TaskLinkT[];
	onTaskUpdated?: (task: TaskT) => void;
	onDeleteTask?: (id: number) => void;
	onAddSubtask?: (parentId: number) => void;
	onFieldChange?: (id: number, patch: Partial<TaskT>) => void;
	onAddQuestion?: (taskId: number, text: string) => void;
	onDeleteQuestion?: (id: number) => void;
	onCreateLink?: (sourceTaskId: number, targetTaskId: number, type: TaskLinkTypeT) => void;
	onDeleteLink?: (id: number) => void;
	onError?: (message: string) => void;
}

/** Renders TasksCanvas with sensible no-op defaults, so each test only spells out what it cares about. */
function renderCanvas(overrides: RenderCanvasOverridesT = {}): void {
	render(
		<TasksCanvas
			tasks={overrides.tasks ?? [baseTask]}
			questions={overrides.questions ?? []}
			links={overrides.links ?? []}
			onTaskUpdated={overrides.onTaskUpdated ?? noop}
			onDeleteTask={overrides.onDeleteTask ?? noop}
			onAddSubtask={overrides.onAddSubtask ?? noop}
			onFieldChange={overrides.onFieldChange ?? noop}
			onAddQuestion={overrides.onAddQuestion ?? noop}
			onDeleteQuestion={overrides.onDeleteQuestion ?? noop}
			onCreateLink={overrides.onCreateLink ?? noop}
			onDeleteLink={overrides.onDeleteLink ?? noop}
			onError={overrides.onError ?? noop}
		/>
	);
}

describe('tasksToNodes', () => {
	it('maps each task to a positioned "task" node carrying the task, its questions, and the callbacks as data', () => {
		const onDelete = vi.fn();
		const onAddSubtask = vi.fn();
		const onFieldChange = vi.fn();
		const onAddQuestion = vi.fn();
		const onDeleteQuestion = vi.fn();
		const nodes = tasksToNodes(
			[baseTask],
			[question],
			onDelete,
			onAddSubtask,
			onFieldChange,
			onAddQuestion,
			onDeleteQuestion
		);

		expect(nodes).toEqual([
			{
				id: '1',
				type: 'task',
				position: { x: 10, y: 20 },
				dragHandle: '.task-card-handle',
				data: {
					task: baseTask,
					questions: [question],
					onDelete,
					onAddSubtask,
					onFieldChange,
					onAddQuestion,
					onDeleteQuestion,
				},
			},
		]);
	});

	it('filters questions to the ones belonging to each task', () => {
		const otherTaskQuestion: TaskQuestionT = { ...question, id: 2, taskId: 2 };
		const nodes = tasksToNodes(
			[baseTask, subtask],
			[question, otherTaskQuestion],
			vi.fn(),
			vi.fn(),
			vi.fn(),
			vi.fn(),
			vi.fn()
		);

		expect(nodes[0].data.questions).toEqual([question]);
		expect(nodes[1].data.questions).toEqual([otherTaskQuestion]);
	});
});

describe('tasksToEdges', () => {
	it('returns no edges when no task has a parentId', () => {
		expect(tasksToEdges([baseTask])).toEqual([]);
	});

	it('emits a hierarchy edge from parent to child, styled with a legible, non-background color', () => {
		const edges = tasksToEdges([baseTask, subtask]);

		expect(edges).toEqual([
			expect.objectContaining({ id: 'hierarchy-1-2', source: '1', target: '2' }),
		]);
		expect(edges[0]?.style?.stroke).toBe('var(--color-text-muted)');
	});
});

describe('linksToEdges', () => {
	it('maps a link to a deletable "link" edge anchored to the right-of-source/left-of-target handles when the source sits left of the target', () => {
		const onDeleteLink = vi.fn();
		const edges = linksToEdges([link], onDeleteLink, [baseTask, subtask]);

		expect(edges).toEqual([
			expect.objectContaining({
				id: 'link-1',
				type: 'link',
				source: '1',
				target: '2',
				sourceHandle: 'link-source',
				targetHandle: 'link-target',
				data: { linkId: 1, onDelete: onDeleteLink },
			}),
		]);
	});

	it('anchors to the left-of-source/right-of-target handles when the source sits right of the target, to avoid the edge looping back through the cards', () => {
		const leftTask = { ...baseTask, id: 2, positionX: 0 };
		const rightTask = { ...subtask, id: 1, parentId: null, positionX: 200 };
		const edges = linksToEdges([{ ...link, sourceTaskId: 1, targetTaskId: 2 }], vi.fn(), [
			rightTask,
			leftTask,
		]);

		expect(edges[0]).toEqual(
			expect.objectContaining({
				sourceHandle: 'link-source-left',
				targetHandle: 'link-target-right',
			})
		);
	});

	it.each([
		['blocks', 'var(--color-danger)'],
		['related', 'var(--color-accent)'],
		['order', 'var(--color-warning)'],
	] satisfies [TaskLinkTypeT, string][])('styles a %s link with %s', (type, color) => {
		const edges = linksToEdges([{ ...link, type }], vi.fn(), [baseTask, subtask]);

		expect(edges[0]?.style?.stroke).toBe(color);
	});

	it('dashes an order link to distinguish it from a related link sharing the same color', () => {
		const relatedEdges = linksToEdges([{ ...link, type: 'related' }], vi.fn(), [baseTask, subtask]);
		const orderEdges = linksToEdges([{ ...link, type: 'order' }], vi.fn(), [baseTask, subtask]);

		expect(relatedEdges[0]?.style?.strokeDasharray).toBeUndefined();
		expect(orderEdges[0]?.style?.strokeDasharray).toBe('6 4');
	});
});

describe('isValidLinkConnection', () => {
	it('rejects a connection where source equals target', () => {
		expect(isValidLinkConnection({ source: '1', target: '1' })).toBe(false);
	});

	it('accepts a connection between two different tasks', () => {
		expect(isValidLinkConnection({ source: '1', target: '2' })).toBe(true);
	});
});

describe('resolveConfirmedLink', () => {
	it('returns undefined when there is no pending connection', () => {
		expect(resolveConfirmedLink(undefined, 'related')).toBeUndefined();
	});

	it('attaches the chosen type to the pending connection', () => {
		const pending = { sourceTaskId: 1, targetTaskId: 2 };
		expect(resolveConfirmedLink(pending, 'blocks')).toEqual({
			sourceTaskId: 1,
			targetTaskId: 2,
			type: 'blocks',
		});
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
		await persistTaskPosition({ id: '1', position: { x: 120, y: 45 } }, onTaskUpdated, vi.fn());

		expect(capturedBody).toEqual({ positionX: 120, positionY: 45 });
		expect(onTaskUpdated).toHaveBeenCalledWith(
			expect.objectContaining({ positionX: 120, positionY: 45 })
		);
	});

	it('logs, calls onError, and does not throw when the PATCH request fails', async () => {
		server.use(http.patch('/api/tasks/1', () => HttpResponse.error()));
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		const onTaskUpdated = vi.fn();
		const onError = vi.fn();
		await expect(
			persistTaskPosition({ id: '1', position: { x: 0, y: 0 } }, onTaskUpdated, onError)
		).resolves.toBeUndefined();

		expect(onTaskUpdated).not.toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalled();
		expect(onError).toHaveBeenCalledWith(expect.any(String));
		consoleErrorSpy.mockRestore();
	});

	it('falls back to a generic message when the rejection is not an Error', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce('connection reset');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		const onError = vi.fn();
		await persistTaskPosition({ id: '1', position: { x: 0, y: 0 } }, vi.fn(), onError);

		expect(onError).toHaveBeenCalledWith('Failed to save the new position.');
		fetchSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});
});

describe('TasksCanvas', () => {
	it('renders a card per task with editable title/description and a status select', () => {
		renderCanvas();

		expect(screen.getByLabelText('Title for Write the report')).toHaveValue('Write the report');
		expect(screen.getByLabelText('Description for Write the report')).toHaveValue(
			'Cover Q3 numbers'
		);
		expect(screen.getByLabelText('Status for Write the report')).toHaveValue('discovery');
	});

	it('commits a title edit via onFieldChange when the title input is blurred', () => {
		const onFieldChange = vi.fn();
		renderCanvas({ onFieldChange });

		const titleInput = screen.getByLabelText('Title for Write the report');
		fireEvent.change(titleInput, { target: { value: 'Write the final report' } });
		fireEvent.blur(titleInput);

		expect(onFieldChange).toHaveBeenCalledWith(1, { title: 'Write the final report' });
	});

	it('commits a description edit via onFieldChange when the description textarea is blurred', () => {
		const onFieldChange = vi.fn();
		renderCanvas({ onFieldChange });

		const descriptionInput = screen.getByLabelText('Description for Write the report');
		fireEvent.change(descriptionInput, { target: { value: 'Updated notes' } });
		fireEvent.blur(descriptionInput);

		expect(onFieldChange).toHaveBeenCalledWith(1, { description: 'Updated notes' });
	});

	it('does not persist an emptied title', () => {
		const onFieldChange = vi.fn();
		renderCanvas({ onFieldChange });

		const titleInput = screen.getByLabelText('Title for Write the report');
		fireEvent.change(titleInput, { target: { value: '   ' } });
		fireEvent.blur(titleInput);

		expect(onFieldChange).not.toHaveBeenCalled();
		expect(titleInput).toHaveValue('Write the report');
	});

	it('does not call onFieldChange when the title is blurred unchanged', () => {
		const onFieldChange = vi.fn();
		renderCanvas({ onFieldChange });

		fireEvent.blur(screen.getByLabelText('Title for Write the report'));

		expect(onFieldChange).not.toHaveBeenCalled();
	});

	it('does not call onFieldChange when a description-less sub-task is blurred unchanged', () => {
		const onFieldChange = vi.fn();
		renderCanvas({ tasks: [baseTask, subtask], onFieldChange });

		fireEvent.blur(screen.getByLabelText('Description for Draft the outline'));

		expect(onFieldChange).not.toHaveBeenCalled();
	});

	it('clears the description to null via onFieldChange when blurred empty', () => {
		const onFieldChange = vi.fn();
		renderCanvas({ onFieldChange });

		const descriptionInput = screen.getByLabelText('Description for Write the report');
		fireEvent.change(descriptionInput, { target: { value: '   ' } });
		fireEvent.blur(descriptionInput);

		expect(onFieldChange).toHaveBeenCalledWith(1, { description: null });
	});

	it('does not show a show-more toggle for a short description', () => {
		renderCanvas();

		expect(screen.queryByText('Show more')).not.toBeInTheDocument();
	});

	it('clamps a long description behind a show-more toggle and expands it on click', () => {
		const longDescription = 'a'.repeat(150);
		renderCanvas({ tasks: [{ ...baseTask, description: longDescription }] });

		const descriptionInput = screen.getByLabelText('Description for Write the report');
		expect(descriptionInput).toHaveAttribute('rows', '2');

		const toggle = screen.getByText('Show more');
		fireEvent.click(toggle);

		expect(descriptionInput).toHaveAttribute('rows', '6');
		expect(screen.getByText('Show less')).toBeInTheDocument();

		fireEvent.click(screen.getByText('Show less'));

		expect(descriptionInput).toHaveAttribute('rows', '2');
	});

	it('commits a status change via onFieldChange immediately on select', () => {
		const onFieldChange = vi.fn();
		renderCanvas({ onFieldChange });

		fireEvent.change(screen.getByLabelText('Status for Write the report'), {
			target: { value: 'research' },
		});

		expect(onFieldChange).toHaveBeenCalledWith(1, { status: 'research' });
	});

	it("calls onDeleteTask when a card's delete button is clicked", () => {
		const onDeleteTask = vi.fn();
		renderCanvas({ onDeleteTask });

		fireEvent.click(screen.getByTestId('delete-task-1'));

		expect(onDeleteTask).toHaveBeenCalledWith(1);
	});

	it("calls onAddSubtask with the parent id when a top-level card's add-sub-task button is clicked", () => {
		const onAddSubtask = vi.fn();
		renderCanvas({ onAddSubtask });

		fireEvent.click(screen.getByTestId('add-subtask-1'));

		expect(onAddSubtask).toHaveBeenCalledWith(1);
	});

	it('does not render an add-sub-task button on a sub-task card', () => {
		renderCanvas({ tasks: [baseTask, subtask] });

		expect(screen.getByTestId('add-subtask-1')).toBeInTheDocument();
		expect(screen.queryByTestId('add-subtask-2')).not.toBeInTheDocument();
	});

	it("renders a task's questions as removable cards", () => {
		const onDeleteQuestion = vi.fn();
		renderCanvas({ questions: [question], onDeleteQuestion });

		expect(screen.getByText('Who owns the budget?')).toBeInTheDocument();

		fireEvent.click(screen.getByTestId('delete-question-1'));

		expect(onDeleteQuestion).toHaveBeenCalledWith(1);
	});

	it('does not show a questions expand toggle at or under the visible-count threshold', () => {
		renderCanvas({ questions: [question] });

		expect(screen.queryByLabelText('Show all questions')).not.toBeInTheDocument();
	});

	it('collapses questions past the visible-count threshold behind an expand toggle', () => {
		const questions = [1, 2, 3, 4].map((id) => ({ ...question, id, text: `Question ${id}` }));
		renderCanvas({ questions });

		expect(screen.getByText('Question 1')).toBeInTheDocument();
		expect(screen.getByText('Question 3')).toBeInTheDocument();
		expect(screen.queryByText('Question 4')).not.toBeInTheDocument();

		fireEvent.click(screen.getByLabelText('Show all questions'));

		expect(screen.getByText('Question 4')).toBeInTheDocument();
		expect(screen.getByLabelText('Show fewer questions')).toBeInTheDocument();
	});

	it('calls onAddQuestion with the task id and text when a new question is submitted', () => {
		const onAddQuestion = vi.fn();
		renderCanvas({ onAddQuestion });

		const input = screen.getByLabelText('Add a question to Write the report');
		fireEvent.change(input, { target: { value: 'Is legal sign-off needed?' } });
		fireEvent.click(screen.getByTestId('add-question-1'));

		expect(onAddQuestion).toHaveBeenCalledWith(1, 'Is legal sign-off needed?');
	});

	it('submits a new question on Enter and clears the input', () => {
		const onAddQuestion = vi.fn();
		renderCanvas({ onAddQuestion });

		const input = screen.getByLabelText('Add a question to Write the report');
		fireEvent.change(input, { target: { value: 'Is legal sign-off needed?' } });
		fireEvent.keyDown(input, { key: 'Enter' });

		expect(onAddQuestion).toHaveBeenCalledWith(1, 'Is legal sign-off needed?');
		expect(input).toHaveValue('');
	});

	it('does not submit a question on a non-Enter key', () => {
		const onAddQuestion = vi.fn();
		renderCanvas({ onAddQuestion });

		const input = screen.getByLabelText('Add a question to Write the report');
		fireEvent.change(input, { target: { value: 'Is legal sign-off needed?' } });
		fireEvent.keyDown(input, { key: 'Tab' });

		expect(onAddQuestion).not.toHaveBeenCalled();
	});

	it('does not call onAddQuestion when the question input is submitted empty', () => {
		const onAddQuestion = vi.fn();
		renderCanvas({ onAddQuestion });

		fireEvent.click(screen.getByTestId('add-question-1'));

		expect(onAddQuestion).not.toHaveBeenCalled();
	});

	it("submits a question from the ↵ affordance, the row's only control", () => {
		const onAddQuestion = vi.fn();
		renderCanvas({ onAddQuestion });

		const submit = screen.getByTestId('add-question-1');
		expect(submit).toHaveTextContent('↵');

		fireEvent.change(screen.getByLabelText('Add a question to Write the report'), {
			target: { value: 'Is legal sign-off needed?' },
		});
		fireEvent.click(submit);

		expect(onAddQuestion).toHaveBeenCalledWith(1, 'Is legal sign-off needed?');
	});

	it('renders pan/zoom controls and a minimap', () => {
		renderCanvas();

		expect(screen.getByTestId('rf__controls')).toBeInTheDocument();
		expect(screen.getByTestId('rf__minimap')).toBeInTheDocument();
	});

	it('renders the status label as text alongside the select, so the longest label cannot clip', () => {
		renderCanvas();

		const select = screen.getByLabelText('Status for Write the report');
		expect(select).toHaveValue('discovery');

		// The visible label is its own element, not the select's own (clip-prone) rendering.
		const band = document.querySelector(`.${TASK_DRAG_HANDLE_CLASS}`);
		expect(band).toHaveTextContent('Discovery');
		expect(select).not.toHaveClass('appearance-none');
	});

	it('balances the band with a type label left and the status right', () => {
		renderCanvas();

		const band = document.querySelector(`.${TASK_DRAG_HANDLE_CLASS}`);
		expect(band).toHaveClass('justify-between');
		expect(band).toHaveTextContent('Task');
		expect(band).toHaveTextContent('Discovery');
	});

	it('labels a sub-task card as such in its band', () => {
		renderCanvas({ tasks: [baseTask, subtask] });

		const bands = document.querySelectorAll(`.${TASK_DRAG_HANDLE_CLASS}`);
		expect(bands).toHaveLength(2);
		expect(bands[0]).toHaveTextContent('Task');
		expect(bands[1]).toHaveTextContent('Sub-task');
	});

	it('confines dragging to the status band, so the editable fields are not drag surfaces', () => {
		renderCanvas();

		// The node advertises the band as its only drag handle...
		const [node] = tasksToNodes([baseTask], [], noop, noop, noop, noop, noop);
		expect(node.dragHandle).toBe(`.${TASK_DRAG_HANDLE_CLASS}`);

		// ...and exactly one element in the rendered card carries that class.
		const handles = document.querySelectorAll(`.${TASK_DRAG_HANDLE_CLASS}`);
		expect(handles).toHaveLength(1);
		expect(handles[0]).toContainElement(screen.getByLabelText('Status for Write the report'));
		expect(handles[0]).not.toContainElement(screen.getByLabelText('Title for Write the report'));
	});

	// Rendering an actual link edge (and its delete button) requires React Flow to have measured
	// both endpoint nodes, which never happens under this project's jsdom ResizeObserver mock —
	// see the comment in LinkEdge.test.tsx, which covers the delete button directly instead.
});

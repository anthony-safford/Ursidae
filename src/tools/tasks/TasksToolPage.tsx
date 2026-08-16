import React, { useCallback, useEffect, useState } from 'react';
import {
	createTaskLink,
	createTaskQuestion,
	deleteTask,
	deleteTaskLink,
	deleteTaskQuestion,
	getTaskLinks,
	getTaskQuestions,
	getTasks,
	updateTask,
} from './tasksApi';
import { TasksCanvas } from './TasksCanvas';
import { TaskEditPanel } from './TaskEditPanel';
import { ConfirmDialog } from './ConfirmDialog';
import { ErrorBanner } from './ErrorBanner';
import { findFreeTaskPosition } from './taskLayout';
import type { TaskLinkT, TaskLinkTypeT, TaskQuestionT, TaskT } from './tasksModel';

/** Sentinel distinguishing "creating a new task" from no panel being open. */
const NEW_TASK = Symbol('new-task');

/** Extracts a human-readable message from a caught error, falling back to a generic one. */
function describeError(error: unknown, fallback: string): string {
	return error instanceof Error ? error.message : fallback;
}

/**
 * Tasks tool page: a freeform canvas of persisted tasks, with create/delete, sub-tasks, and
 * relationship links. Editing happens inline on each card.
 */
export const TasksToolPage = (): React.ReactElement => {
	const [tasks, setTasks] = useState<TaskT[] | undefined>();
	const [questions, setQuestions] = useState<TaskQuestionT[] | undefined>();
	const [links, setLinks] = useState<TaskLinkT[] | undefined>();
	const [editing, setEditing] = useState<typeof NEW_TASK | undefined>();
	const [newTaskParent, setNewTaskParent] = useState<TaskT | undefined>();
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | undefined>();
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		const fetchAll = async (): Promise<void> => {
			try {
				const [taskData, questionData, linkData] = await Promise.all([
					getTasks(),
					getTaskQuestions(),
					getTaskLinks(),
				]);
				setTasks(taskData);
				setQuestions(questionData);
				setLinks(linkData);
			} catch (fetchError) {
				console.error('Failed to fetch tasks:', fetchError);
				setError(describeError(fetchError, 'Failed to load tasks.'));
			}
		};

		void fetchAll();
	}, []);

	const handleOpenAddTask = useCallback(() => {
		setNewTaskParent(undefined);
		setEditing(NEW_TASK);
	}, []);

	const handleTaskUpdated = useCallback((updated: TaskT) => {
		setTasks((prev) => prev?.map((task) => (task.id === updated.id ? updated : task)));
	}, []);

	const handleFieldChange = useCallback(
		(id: number, patch: Partial<Pick<TaskT, 'title' | 'description' | 'status'>>) => {
			updateTask(id, patch)
				.then(handleTaskUpdated)
				.catch((fieldError: unknown) => {
					console.error('Failed to save task field:', fieldError);
					setError(describeError(fieldError, 'Failed to save your change.'));
				});
		},
		[handleTaskUpdated]
	);

	// TaskEditPanel only ever creates a task (never edits one — edits happen inline on the card),
	// so `saved` is always a fresh row and this only ever appends.
	const handleTaskSaved = useCallback((saved: TaskT) => {
		setTasks((prev) => [...(prev ?? []), saved]);
		setEditing(undefined);
		setNewTaskParent(undefined);
	}, []);

	const handleAddSubtask = useCallback(
		(parentId: number) => {
			const parent = tasks?.find((t) => t.id === parentId);
			if (!parent) return;
			setNewTaskParent(parent);
			setEditing(NEW_TASK);
		},
		[tasks]
	);

	const handleRequestDeleteTask = useCallback((id: number) => {
		setConfirmDeleteId(id);
	}, []);

	const handleConfirmDeleteTask = useCallback(() => {
		if (confirmDeleteId === undefined) return;
		const id = confirmDeleteId;
		setConfirmDeleteId(undefined);

		const removedIds = new Set(
			(tasks ?? []).filter((task) => task.id === id || task.parentId === id).map((task) => task.id)
		);
		const removedTasks = (tasks ?? []).filter((task) => removedIds.has(task.id));
		const removedQuestions = (questions ?? []).filter((question) =>
			removedIds.has(question.taskId)
		);
		const removedLinks = (links ?? []).filter(
			(link) => removedIds.has(link.sourceTaskId) || removedIds.has(link.targetTaskId)
		);

		setTasks((prev) => prev?.filter((task) => !removedIds.has(task.id)));
		setQuestions((prev) => prev?.filter((question) => !removedIds.has(question.taskId)));
		setLinks((prev) =>
			prev?.filter(
				(link) => !removedIds.has(link.sourceTaskId) && !removedIds.has(link.targetTaskId)
			)
		);

		deleteTask(id).catch((deleteError: unknown) => {
			console.error('Failed to delete task:', deleteError);
			setTasks((prev) => (prev ? [...prev, ...removedTasks] : prev));
			setQuestions((prev) => (prev ? [...prev, ...removedQuestions] : prev));
			setLinks((prev) => (prev ? [...prev, ...removedLinks] : prev));
			setError(describeError(deleteError, 'Failed to delete the task. It has been restored.'));
		});
	}, [confirmDeleteId, tasks, questions, links]);

	const handleAddQuestion = useCallback((taskId: number, text: string) => {
		createTaskQuestion({ taskId, text })
			.then((question) => {
				setQuestions((prev) => [...(prev ?? []), question]);
			})
			.catch((addError: unknown) => {
				console.error('Failed to add question:', addError);
				setError(describeError(addError, 'Failed to add the question.'));
			});
	}, []);

	const handleDeleteQuestion = useCallback(
		(id: number) => {
			const removed = (questions ?? []).find((question) => question.id === id);
			setQuestions((prev) => prev?.filter((question) => question.id !== id));

			deleteTaskQuestion(id).catch((deleteError: unknown) => {
				console.error('Failed to delete question:', deleteError);
				if (removed) setQuestions((prev) => (prev ? [...prev, removed] : prev));
				setError(
					describeError(deleteError, 'Failed to delete the question. It has been restored.')
				);
			});
		},
		[questions]
	);

	const handleCreateLink = useCallback(
		(sourceTaskId: number, targetTaskId: number, type: TaskLinkTypeT) => {
			createTaskLink({ sourceTaskId, targetTaskId, type })
				.then((link) => {
					setLinks((prev) => [...(prev ?? []), link]);
				})
				.catch((createError: unknown) => {
					console.error('Failed to create link:', createError);
					setError(describeError(createError, 'Failed to create the link.'));
				});
		},
		[]
	);

	const handleDeleteLink = useCallback(
		(id: number) => {
			const removed = (links ?? []).find((link) => link.id === id);
			setLinks((prev) => prev?.filter((link) => link.id !== id));

			deleteTaskLink(id).catch((deleteError: unknown) => {
				console.error('Failed to delete link:', deleteError);
				if (removed) setLinks((prev) => (prev ? [...prev, removed] : prev));
				setError(describeError(deleteError, 'Failed to delete the link. It has been restored.'));
			});
		},
		[links]
	);

	const handleCanvasError = useCallback((message: string) => {
		setError(message);
	}, []);

	return (
		<div className="p-lg">
			<h2 className="text-2xl font-bold">Tasks</h2>
			<p className="text-text-muted">
				Unplanned, untracked tasks and sub-tasks, on a freeform relationship canvas.
			</p>

			{error && <ErrorBanner message={error} onDismiss={() => setError(undefined)} />}

			<div className="mt-lg">
				{tasks === undefined || questions === undefined || links === undefined ? (
					<p className="text-text-muted">Loading...</p>
				) : (
					<>
						<div className="flex justify-end mb-sm">
							<button
								type="button"
								onClick={handleOpenAddTask}
								className="rounded-brand bg-accent px-md py-sm uppercase tracking-wide text-sm font-medium text-text hover:bg-accent-hover transition-colors duration-200"
							>
								Add Task
							</button>
						</div>

						{tasks.length === 0 ? (
							<div className="flex h-[70vh] flex-col items-center justify-center gap-sm rounded-brand border border-dashed border-border bg-surface p-xl text-center">
								<p className="text-text-muted">No tasks yet.</p>
								<p className="text-sm text-text-muted max-w-[24rem]">
									Capture unplanned, untracked work as a card on the canvas — you can connect it to
									other tasks and break it into sub-tasks later.
								</p>
								<button
									type="button"
									onClick={handleOpenAddTask}
									className="mt-sm rounded-brand bg-accent px-md py-sm uppercase tracking-wide text-sm font-medium text-text hover:bg-accent-hover transition-colors duration-200"
								>
									Add your first task
								</button>
							</div>
						) : (
							<TasksCanvas
								tasks={tasks}
								questions={questions}
								links={links}
								onTaskUpdated={handleTaskUpdated}
								onDeleteTask={handleRequestDeleteTask}
								onAddSubtask={handleAddSubtask}
								onFieldChange={handleFieldChange}
								onAddQuestion={handleAddQuestion}
								onDeleteQuestion={handleDeleteQuestion}
								onCreateLink={handleCreateLink}
								onDeleteLink={handleDeleteLink}
								onError={handleCanvasError}
							/>
						)}
					</>
				)}
			</div>

			{editing !== undefined && (
				<TaskEditPanel
					parentId={newTaskParent?.id}
					initialPosition={findFreeTaskPosition(
						tasks ?? [],
						newTaskParent
							? { x: newTaskParent.positionX + 60, y: newTaskParent.positionY + 260 }
							: undefined
					)}
					onSaved={handleTaskSaved}
					onClose={() => {
						setEditing(undefined);
						setNewTaskParent(undefined);
					}}
					onError={setError}
				/>
			)}

			{confirmDeleteId !== undefined && (
				<ConfirmDialog
					title="Delete task?"
					message="This also deletes its sub-tasks, their questions, and any links to or from them. This can't be undone."
					confirmLabel="Delete"
					onConfirm={handleConfirmDeleteTask}
					onCancel={() => setConfirmDeleteId(undefined)}
				/>
			)}
		</div>
	);
};

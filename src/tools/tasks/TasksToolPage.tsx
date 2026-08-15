import React, { useCallback, useEffect, useState } from 'react';
import {
	createTaskQuestion,
	deleteTask,
	deleteTaskQuestion,
	getTaskQuestions,
	getTasks,
	updateTask,
} from './tasksApi';
import { TasksCanvas } from './TasksCanvas';
import { TaskEditPanel } from './TaskEditPanel';
import type { TaskQuestionT, TaskT } from './tasksModel';

/** Sentinel distinguishing "creating a new task" from no panel being open. */
const NEW_TASK = Symbol('new-task');

/**
 * Tasks tool page: a freeform canvas of persisted tasks, with create/delete and sub-tasks.
 * Editing happens inline on each card; relationship links land in a later feature of this epic.
 */
export const TasksToolPage = (): React.ReactElement => {
	const [tasks, setTasks] = useState<TaskT[] | undefined>();
	const [questions, setQuestions] = useState<TaskQuestionT[] | undefined>();
	const [editing, setEditing] = useState<typeof NEW_TASK | undefined>();
	const [newTaskParent, setNewTaskParent] = useState<TaskT | undefined>();

	useEffect(() => {
		const fetchAll = async (): Promise<void> => {
			try {
				const [taskData, questionData] = await Promise.all([getTasks(), getTaskQuestions()]);
				setTasks(taskData);
				setQuestions(questionData);
			} catch (error) {
				console.error('Failed to fetch tasks:', error);
			}
		};

		void fetchAll();
	}, []);

	const handleTaskUpdated = useCallback((updated: TaskT) => {
		setTasks((prev) => prev?.map((task) => (task.id === updated.id ? updated : task)));
	}, []);

	const handleFieldChange = useCallback(
		(id: number, patch: Partial<Pick<TaskT, 'title' | 'description' | 'status'>>) => {
			updateTask(id, patch)
				.then(handleTaskUpdated)
				.catch((error: unknown) => {
					console.error('Failed to save task field:', error);
				});
		},
		[handleTaskUpdated]
	);

	const handleTaskSaved = useCallback((saved: TaskT) => {
		setTasks((prev) => {
			if (!prev) return prev;
			const exists = prev.some((task) => task.id === saved.id);
			return exists ? prev.map((task) => (task.id === saved.id ? saved : task)) : [...prev, saved];
		});
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

	const handleDeleteTask = useCallback(
		(id: number) => {
			const removedIds = new Set(
				(tasks ?? [])
					.filter((task) => task.id === id || task.parentId === id)
					.map((task) => task.id)
			);
			setTasks((prev) => prev?.filter((task) => !removedIds.has(task.id)));
			setQuestions((prev) => prev?.filter((question) => !removedIds.has(question.taskId)));
			deleteTask(id).catch((error: unknown) => {
				console.error('Failed to delete task:', error);
			});
		},
		[tasks]
	);

	const handleAddQuestion = useCallback((taskId: number, text: string) => {
		createTaskQuestion({ taskId, text })
			.then((question) => {
				setQuestions((prev) => [...(prev ?? []), question]);
			})
			.catch((error: unknown) => {
				console.error('Failed to add question:', error);
			});
	}, []);

	const handleDeleteQuestion = useCallback((id: number) => {
		setQuestions((prev) => prev?.filter((question) => question.id !== id));
		deleteTaskQuestion(id).catch((error: unknown) => {
			console.error('Failed to delete question:', error);
		});
	}, []);

	return (
		<div className="p-lg">
			<h2 className="text-2xl font-bold">Tasks</h2>
			<p className="text-text-muted">
				Unplanned, untracked tasks and sub-tasks, on a freeform relationship canvas.
			</p>

			<div className="mt-lg">
				{tasks === undefined || questions === undefined ? (
					<p className="text-text-muted">Loading...</p>
				) : (
					<>
						<div className="flex justify-end mb-sm">
							<button
								type="button"
								onClick={() => {
									setNewTaskParent(undefined);
									setEditing(NEW_TASK);
								}}
								className="rounded-brand bg-accent px-md py-sm uppercase tracking-wide text-sm font-medium text-text hover:bg-accent-hover transition-colors duration-200"
							>
								Add Task
							</button>
						</div>

						{tasks.length === 0 ? (
							<p className="text-text-muted">No tasks yet.</p>
						) : (
							<TasksCanvas
								tasks={tasks}
								questions={questions}
								onTaskUpdated={handleTaskUpdated}
								onDeleteTask={handleDeleteTask}
								onAddSubtask={handleAddSubtask}
								onFieldChange={handleFieldChange}
								onAddQuestion={handleAddQuestion}
								onDeleteQuestion={handleDeleteQuestion}
							/>
						)}
					</>
				)}
			</div>

			{editing !== undefined && (
				<TaskEditPanel
					parentId={newTaskParent?.id}
					initialPosition={
						newTaskParent
							? { x: newTaskParent.positionX + 60, y: newTaskParent.positionY + 260 }
							: undefined
					}
					onSaved={handleTaskSaved}
					onClose={() => {
						setEditing(undefined);
						setNewTaskParent(undefined);
					}}
				/>
			)}
		</div>
	);
};

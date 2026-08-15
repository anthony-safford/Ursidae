import React, { useCallback, useEffect, useState } from 'react';
import { deleteTask, getTasks } from './tasksApi';
import { TasksCanvas } from './TasksCanvas';
import { TaskEditPanel } from './TaskEditPanel';
import type { TaskT } from './tasksModel';

/** Sentinel distinguishing "creating a new task" from "editing an existing one". */
const NEW_TASK = Symbol('new-task');

/**
 * Tasks tool page: a freeform canvas of persisted tasks, with create/edit/delete.
 * Sub-tasks and relationship links land in later features of this epic.
 */
export const TasksToolPage = (): React.ReactElement => {
	const [tasks, setTasks] = useState<TaskT[] | undefined>();
	const [editing, setEditing] = useState<TaskT | typeof NEW_TASK | undefined>();

	useEffect(() => {
		const fetchTasks = async (): Promise<void> => {
			try {
				const data = await getTasks();
				setTasks(data);
			} catch (error) {
				console.error('Failed to fetch tasks:', error);
			}
		};

		void fetchTasks();
	}, []);

	const handleTaskUpdated = useCallback((updated: TaskT) => {
		setTasks((prev) => prev?.map((task) => (task.id === updated.id ? updated : task)));
	}, []);

	const handleTaskSaved = useCallback((saved: TaskT) => {
		setTasks((prev) => {
			if (!prev) return prev;
			const exists = prev.some((task) => task.id === saved.id);
			return exists ? prev.map((task) => (task.id === saved.id ? saved : task)) : [...prev, saved];
		});
		setEditing(undefined);
	}, []);

	const handleEditTask = useCallback(
		(id: number) => {
			const task = tasks?.find((t) => t.id === id);
			if (task) setEditing(task);
		},
		[tasks]
	);

	const handleDeleteTask = useCallback((id: number) => {
		setTasks((prev) => prev?.filter((task) => task.id !== id));
		deleteTask(id).catch((error: unknown) => {
			console.error('Failed to delete task:', error);
		});
	}, []);

	return (
		<div className="p-lg">
			<h2 className="text-2xl font-bold">Tasks</h2>
			<p className="text-text-muted">
				Unplanned, untracked tasks and sub-tasks, on a freeform relationship canvas.
			</p>

			<div className="mt-lg">
				{tasks === undefined ? (
					<p className="text-text-muted">Loading...</p>
				) : (
					<>
						<div className="flex justify-end mb-sm">
							<button
								type="button"
								onClick={() => setEditing(NEW_TASK)}
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
								onTaskUpdated={handleTaskUpdated}
								onEditTask={handleEditTask}
								onDeleteTask={handleDeleteTask}
							/>
						)}
					</>
				)}
			</div>

			{editing !== undefined && (
				<TaskEditPanel
					task={editing === NEW_TASK ? undefined : editing}
					onSaved={handleTaskSaved}
					onClose={() => setEditing(undefined)}
				/>
			)}
		</div>
	);
};

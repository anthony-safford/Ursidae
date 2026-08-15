import React, { useCallback, useEffect, useState } from 'react';
import { getTasks } from './tasksApi';
import { TasksCanvas } from './TasksCanvas';
import type { TaskT } from './tasksModel';

/**
 * Tasks tool page: a freeform canvas of persisted tasks. Creating/editing tasks,
 * sub-tasks, and relationship links land in later features of this epic.
 */
export const TasksToolPage = (): React.ReactElement => {
	const [tasks, setTasks] = useState<TaskT[] | undefined>();

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

	return (
		<div className="p-lg">
			<h2 className="text-2xl font-bold">Tasks</h2>
			<p className="text-text-muted">
				Unplanned, untracked tasks and sub-tasks, on a freeform relationship canvas.
			</p>

			<div className="mt-lg">
				{tasks === undefined ? (
					<p className="text-text-muted">Loading...</p>
				) : tasks.length === 0 ? (
					<p className="text-text-muted">No tasks yet.</p>
				) : (
					<TasksCanvas tasks={tasks} onTaskUpdated={handleTaskUpdated} />
				)}
			</div>
		</div>
	);
};

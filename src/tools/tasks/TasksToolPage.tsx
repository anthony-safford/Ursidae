import React, { useEffect, useState } from 'react';
import { getTasks } from './tasksApi';
import type { TaskT } from './tasksModel';

/**
 * Tasks tool page. Currently renders a plain list of persisted tasks; the freeform
 * canvas and relationship diagramming land in later features of this epic.
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

	return (
		<div className="p-lg">
			<h2 className="text-2xl font-bold">Tasks</h2>
			<p className="text-text-muted">
				Unplanned, untracked tasks and sub-tasks. A freeform relationship canvas is coming soon.
			</p>

			<div className="mt-lg">
				{tasks === undefined ? (
					<p className="text-text-muted">Loading...</p>
				) : tasks.length === 0 ? (
					<p className="text-text-muted">No tasks yet.</p>
				) : (
					<ul className="flex flex-col gap-sm">
						{tasks.map((task) => (
							<li key={task.id} className="bg-surface border border-border rounded-brand p-md">
								<div className="flex items-center justify-between gap-sm">
									<span className="font-semibold">{task.title}</span>
									<span className="text-xs uppercase tracking-wide text-text-muted">
										{task.status}
									</span>
								</div>
								{task.description && (
									<p className="text-sm text-text-muted mt-xs">{task.description}</p>
								)}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};

import React from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import type { TaskT } from './tasksModel';

export type TaskNodeT = Node<{ task: TaskT }, 'task'>;

const STATUS_LABEL: Record<TaskT['status'], string> = {
	open: 'Open',
	in_progress: 'In Progress',
	done: 'Done',
};

/** React Flow node rendering a task card: title, description, and status. */
export const TaskNode = ({ data }: NodeProps<TaskNodeT>): React.ReactElement => {
	const { task } = data;

	return (
		<div className="w-64 bg-surface border border-border rounded-brand p-md cursor-grab active:cursor-grabbing">
			<div className="flex items-center justify-between gap-sm">
				<span className="font-semibold">{task.title}</span>
				<span className="text-xs uppercase tracking-wide text-text-muted whitespace-nowrap">
					{STATUS_LABEL[task.status]}
				</span>
			</div>
			{task.description && (
				<p className="text-sm text-text-muted mt-xs line-clamp-3">{task.description}</p>
			)}
		</div>
	);
};

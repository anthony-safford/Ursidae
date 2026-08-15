import React from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import { Trash } from '@phosphor-icons/react';
import type { TaskT } from './tasksModel';

export type TaskNodeT = Node<{ task: TaskT; onDelete: (id: number) => void }, 'task'>;

const STATUS_LABEL: Record<TaskT['status'], string> = {
	open: 'Open',
	in_progress: 'In Progress',
	done: 'Done',
};

/** React Flow node rendering a task card: title, description, status, and a delete action. */
export const TaskNode = ({ data }: NodeProps<TaskNodeT>): React.ReactElement => {
	const { task, onDelete } = data;

	return (
		<div className="w-64 bg-surface border border-border rounded-brand p-md cursor-grab active:cursor-grabbing">
			<div className="flex items-center justify-between gap-sm">
				<span className="font-semibold">{task.title}</span>
				<div className="flex items-center gap-xs">
					<span className="text-xs uppercase tracking-wide text-text-muted whitespace-nowrap">
						{STATUS_LABEL[task.status]}
					</span>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDelete(task.id);
						}}
						onMouseDown={(e) => e.stopPropagation()}
						aria-label={`Delete ${task.title}`}
						data-testid={`delete-task-${task.id}`}
						className="text-text-muted hover:text-danger transition-colors duration-200"
					>
						<Trash size={14} weight="bold" />
					</button>
				</div>
			</div>
			{task.description && (
				<p className="text-sm text-text-muted mt-xs line-clamp-3">{task.description}</p>
			)}
		</div>
	);
};

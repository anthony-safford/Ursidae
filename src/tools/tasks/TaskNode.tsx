import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Plus, Trash } from '@phosphor-icons/react';
import type { TaskT } from './tasksModel';

/** Hidden, non-interactive: only anchors auto-drawn hierarchy edges. Draggable connect handles land in #43. */
const hiddenHandleStyle: React.CSSProperties = { opacity: 0, pointerEvents: 'none' };

export type TaskNodeT = Node<
	{ task: TaskT; onDelete: (id: number) => void; onAddSubtask: (parentId: number) => void },
	'task'
>;

const STATUS_LABEL: Record<TaskT['status'], string> = {
	open: 'Open',
	in_progress: 'In Progress',
	done: 'Done',
};

/** React Flow node rendering a task card: title, description, status, and a delete action. */
export const TaskNode = ({ data }: NodeProps<TaskNodeT>): React.ReactElement => {
	const { task, onDelete, onAddSubtask } = data;
	const isSubtask = task.parentId !== null;

	return (
		<div
			className={`${isSubtask ? 'w-48 p-sm' : 'w-64 p-md'} bg-surface border border-border rounded-brand cursor-grab active:cursor-grabbing`}
		>
			<Handle
				type="target"
				position={Position.Top}
				isConnectable={false}
				style={hiddenHandleStyle}
			/>
			<Handle
				type="source"
				position={Position.Bottom}
				isConnectable={false}
				style={hiddenHandleStyle}
			/>
			<div className="flex items-center justify-between gap-sm">
				<span className="font-semibold">{task.title}</span>
				<div className="flex items-center gap-xs">
					<span className="text-xs uppercase tracking-wide text-text-muted whitespace-nowrap">
						{STATUS_LABEL[task.status]}
					</span>
					{!isSubtask && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onAddSubtask(task.id);
							}}
							onMouseDown={(e) => e.stopPropagation()}
							aria-label={`Add sub-task to ${task.title}`}
							data-testid={`add-subtask-${task.id}`}
							className="text-text-muted hover:text-accent transition-colors duration-200"
						>
							<Plus size={14} weight="bold" />
						</button>
					)}
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

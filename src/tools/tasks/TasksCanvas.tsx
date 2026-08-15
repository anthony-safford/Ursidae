import React, { useCallback, useEffect } from 'react';
import {
	ReactFlow,
	Background,
	useNodesState,
	type OnNodeDrag,
	type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TaskNode, type TaskNodeT } from './TaskNode';
import { updateTask } from './tasksApi';
import type { TaskT } from './tasksModel';

const nodeTypes = { task: TaskNode };

interface TasksCanvasProps {
	/** Tasks to render as nodes, positioned at their persisted x/y. */
	tasks: TaskT[];
	/** Called with the updated task after a drag persists its new position. */
	onTaskUpdated: (task: TaskT) => void;
	/** Called with a task's id when its card is clicked, to open it for editing. */
	onEditTask: (id: number) => void;
	/** Called with a task's id when its delete action is clicked. */
	onDeleteTask: (id: number) => void;
}

/** Maps tasks to React Flow nodes positioned at their persisted x/y. */
export function tasksToNodes(tasks: TaskT[], onDelete: (id: number) => void): TaskNodeT[] {
	return tasks.map((task) => ({
		id: String(task.id),
		type: 'task',
		position: { x: task.positionX, y: task.positionY },
		data: { task, onDelete },
	}));
}

/** Persists a node's post-drag position and notifies the caller with the updated task. */
export function persistTaskPosition(
	node: { id: string; position: { x: number; y: number } },
	onTaskUpdated: (task: TaskT) => void
): Promise<void> {
	const id = Number(node.id);
	return updateTask(id, { positionX: node.position.x, positionY: node.position.y })
		.then(onTaskUpdated)
		.catch((error: unknown) => {
			console.error('Failed to persist task position:', error);
		});
}

/** Freeform, pannable/zoomable canvas rendering tasks as draggable, clickable cards. */
export const TasksCanvas = ({
	tasks,
	onTaskUpdated,
	onEditTask,
	onDeleteTask,
}: TasksCanvasProps): React.ReactElement => {
	const [nodes, setNodes, onNodesChange] = useNodesState<TaskNodeT>(
		tasksToNodes(tasks, onDeleteTask)
	);

	useEffect(() => {
		setNodes(tasksToNodes(tasks, onDeleteTask));
	}, [tasks, onDeleteTask, setNodes]);

	const handleNodeDragStop: OnNodeDrag<TaskNodeT> = useCallback(
		(_event, node) => {
			void persistTaskPosition(node, onTaskUpdated);
		},
		[onTaskUpdated]
	);

	const handleNodeClick: NodeMouseHandler<TaskNodeT> = useCallback(
		(_event, node) => {
			onEditTask(Number(node.id));
		},
		[onEditTask]
	);

	return (
		<div className="h-[70vh] bg-surface border border-border rounded-brand overflow-hidden">
			<ReactFlow
				nodes={nodes}
				onNodesChange={onNodesChange}
				nodeTypes={nodeTypes}
				onNodeDragStop={handleNodeDragStop}
				onNodeClick={handleNodeClick}
				fitView
			>
				<Background />
			</ReactFlow>
		</div>
	);
};

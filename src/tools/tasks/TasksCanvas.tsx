import React, { useCallback, useEffect } from 'react';
import {
	ReactFlow,
	Background,
	useNodesState,
	useEdgesState,
	type Edge,
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
	/** Called with a task's id when its "add sub-task" action is clicked. */
	onAddSubtask: (parentId: number) => void;
}

/** Maps tasks to React Flow nodes positioned at their persisted x/y. */
export function tasksToNodes(
	tasks: TaskT[],
	onDelete: (id: number) => void,
	onAddSubtask: (parentId: number) => void
): TaskNodeT[] {
	return tasks.map((task) => ({
		id: String(task.id),
		type: 'task',
		position: { x: task.positionX, y: task.positionY },
		data: { task, onDelete, onAddSubtask },
	}));
}

/** Maps parent/child task relationships to a muted, dashed hierarchy connector per sub-task. */
export function tasksToEdges(tasks: TaskT[]): Edge[] {
	return tasks
		.filter((task): task is TaskT & { parentId: number } => task.parentId !== null)
		.map((task) => ({
			id: `hierarchy-${task.parentId}-${task.id}`,
			source: String(task.parentId),
			target: String(task.id),
			style: { stroke: 'var(--color-border)', strokeDasharray: '4 4' },
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
	onAddSubtask,
}: TasksCanvasProps): React.ReactElement => {
	const [nodes, setNodes, onNodesChange] = useNodesState<TaskNodeT>(
		tasksToNodes(tasks, onDeleteTask, onAddSubtask)
	);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(tasksToEdges(tasks));

	useEffect(() => {
		setNodes(tasksToNodes(tasks, onDeleteTask, onAddSubtask));
		setEdges(tasksToEdges(tasks));
	}, [tasks, onDeleteTask, onAddSubtask, setNodes, setEdges]);

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
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
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

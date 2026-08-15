import React, { useCallback, useEffect } from 'react';
import {
	ReactFlow,
	Background,
	useNodesState,
	useEdgesState,
	type Edge,
	type OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TaskNode, type TaskNodeT } from './TaskNode';
import { updateTask } from './tasksApi';
import type { TaskQuestionT, TaskT } from './tasksModel';

const nodeTypes = { task: TaskNode };

interface TasksCanvasProps {
	/** Tasks to render as nodes, positioned at their persisted x/y. */
	tasks: TaskT[];
	/** Questions across all tasks; filtered per-node by taskId. */
	questions: TaskQuestionT[];
	/** Called with the updated task after a drag or inline field edit persists. */
	onTaskUpdated: (task: TaskT) => void;
	/** Called with a task's id when its delete action is clicked. */
	onDeleteTask: (id: number) => void;
	/** Called with a task's id when its "add sub-task" action is clicked. */
	onAddSubtask: (parentId: number) => void;
	/** Called with a task's id and the changed fields when an inline edit is committed. */
	onFieldChange: (
		id: number,
		patch: Partial<Pick<TaskT, 'title' | 'description' | 'status'>>
	) => void;
	/** Called with a task's id and text when a question is added to it. */
	onAddQuestion: (taskId: number, text: string) => void;
	/** Called with a question's id when it's removed. */
	onDeleteQuestion: (id: number) => void;
}

/** Maps tasks to React Flow nodes positioned at their persisted x/y. */
export function tasksToNodes(
	tasks: TaskT[],
	questions: TaskQuestionT[],
	onDelete: (id: number) => void,
	onAddSubtask: (parentId: number) => void,
	onFieldChange: TasksCanvasProps['onFieldChange'],
	onAddQuestion: (taskId: number, text: string) => void,
	onDeleteQuestion: (id: number) => void
): TaskNodeT[] {
	return tasks.map((task) => ({
		id: String(task.id),
		type: 'task',
		position: { x: task.positionX, y: task.positionY },
		data: {
			task,
			questions: questions.filter((q) => q.taskId === task.id),
			onDelete,
			onAddSubtask,
			onFieldChange,
			onAddQuestion,
			onDeleteQuestion,
		},
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
			style: { stroke: 'var(--color-text-muted)', strokeWidth: 1.5, strokeDasharray: '4 4' },
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

/** Freeform, pannable/zoomable canvas rendering tasks as draggable, inline-editable cards. */
export const TasksCanvas = ({
	tasks,
	questions,
	onTaskUpdated,
	onDeleteTask,
	onAddSubtask,
	onFieldChange,
	onAddQuestion,
	onDeleteQuestion,
}: TasksCanvasProps): React.ReactElement => {
	const [nodes, setNodes, onNodesChange] = useNodesState<TaskNodeT>(
		tasksToNodes(
			tasks,
			questions,
			onDeleteTask,
			onAddSubtask,
			onFieldChange,
			onAddQuestion,
			onDeleteQuestion
		)
	);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(tasksToEdges(tasks));

	useEffect(() => {
		setNodes(
			tasksToNodes(
				tasks,
				questions,
				onDeleteTask,
				onAddSubtask,
				onFieldChange,
				onAddQuestion,
				onDeleteQuestion
			)
		);
		setEdges(tasksToEdges(tasks));
	}, [
		tasks,
		questions,
		onDeleteTask,
		onAddSubtask,
		onFieldChange,
		onAddQuestion,
		onDeleteQuestion,
		setNodes,
		setEdges,
	]);

	const handleNodeDragStop: OnNodeDrag<TaskNodeT> = useCallback(
		(_event, node) => {
			void persistTaskPosition(node, onTaskUpdated);
		},
		[onTaskUpdated]
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
				fitView
			>
				<Background />
			</ReactFlow>
		</div>
	);
};

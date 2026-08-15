import React, { useCallback, useEffect, useState } from 'react';
import {
	ReactFlow,
	Background,
	useNodesState,
	useEdgesState,
	MarkerType,
	type Connection,
	type Edge,
	type OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TaskNode, type TaskNodeT } from './TaskNode';
import { LinkEdge } from './LinkEdge';
import { LinkTypePicker } from './LinkTypePicker';
import { updateTask } from './tasksApi';
import type { TaskLinkT, TaskLinkTypeT, TaskQuestionT, TaskT } from './tasksModel';

const nodeTypes = { task: TaskNode };
const edgeTypes = { link: LinkEdge };

/** Per-type edge color, reusing existing design tokens only — deliberately distinct from the
 * hierarchy edge's dashed, muted styling so structural and user-drawn edges never look alike. */
const LINK_TYPE_COLOR: Record<TaskLinkTypeT, string> = {
	blocks: 'var(--color-danger)',
	related: 'var(--color-accent)',
	order: 'var(--color-accent-hover)',
};

interface TasksCanvasProps {
	/** Tasks to render as nodes, positioned at their persisted x/y. */
	tasks: TaskT[];
	/** Questions across all tasks; filtered per-node by taskId. */
	questions: TaskQuestionT[];
	/** Relationship links between tasks, rendered as styled, deletable edges. */
	links: TaskLinkT[];
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
	/** Called after a drag-to-connect is confirmed with a type, to persist the new link. */
	onCreateLink: (sourceTaskId: number, targetTaskId: number, type: TaskLinkTypeT) => void;
	/** Called with a link's id when its delete button is clicked. */
	onDeleteLink: (id: number) => void;
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

/** Maps relationship links to styled, deletable edges anchored to each card's link handles. */
export function linksToEdges(links: TaskLinkT[], onDeleteLink: (id: number) => void): Edge[] {
	return links.map((link) => {
		const color = LINK_TYPE_COLOR[link.type];
		return {
			id: `link-${link.id}`,
			type: 'link',
			source: String(link.sourceTaskId),
			target: String(link.targetTaskId),
			sourceHandle: 'link-source',
			targetHandle: 'link-target',
			style: { stroke: color, strokeWidth: 2 },
			markerEnd: { type: MarkerType.ArrowClosed, color },
			data: { linkId: link.id, onDelete: onDeleteLink },
		};
	});
}

/** Rejects a connection where the source and target are the same task (a self-loop). */
export function isValidLinkConnection(connection: { source: string; target: string }): boolean {
	return connection.source !== connection.target;
}

/** Resolves the link to create from a pending connection and the chosen type, or `undefined` if
 * there's no pending connection to resolve (e.g. the picker was somehow confirmed after being
 * dismissed). */
export function resolveConfirmedLink(
	pendingConnection: { sourceTaskId: number; targetTaskId: number } | undefined,
	type: TaskLinkTypeT
): { sourceTaskId: number; targetTaskId: number; type: TaskLinkTypeT } | undefined {
	if (!pendingConnection) return undefined;
	return { ...pendingConnection, type };
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
	links,
	onTaskUpdated,
	onDeleteTask,
	onAddSubtask,
	onFieldChange,
	onAddQuestion,
	onDeleteQuestion,
	onCreateLink,
	onDeleteLink,
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
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([
		...tasksToEdges(tasks),
		...linksToEdges(links, onDeleteLink),
	]);
	const [pendingConnection, setPendingConnection] = useState<
		{ sourceTaskId: number; targetTaskId: number } | undefined
	>();

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
		setEdges([...tasksToEdges(tasks), ...linksToEdges(links, onDeleteLink)]);
	}, [
		tasks,
		questions,
		links,
		onDeleteTask,
		onAddSubtask,
		onFieldChange,
		onAddQuestion,
		onDeleteQuestion,
		onDeleteLink,
		setNodes,
		setEdges,
	]);

	const handleNodeDragStop: OnNodeDrag<TaskNodeT> = useCallback(
		(_event, node) => {
			void persistTaskPosition(node, onTaskUpdated);
		},
		[onTaskUpdated]
	);

	const handleConnect = useCallback((connection: Connection) => {
		setPendingConnection({
			sourceTaskId: Number(connection.source),
			targetTaskId: Number(connection.target),
		});
	}, []);

	const handleConfirmLink = useCallback(
		(type: TaskLinkTypeT) => {
			const resolved = resolveConfirmedLink(pendingConnection, type);
			if (resolved) onCreateLink(resolved.sourceTaskId, resolved.targetTaskId, resolved.type);
			setPendingConnection(undefined);
		},
		[pendingConnection, onCreateLink]
	);

	return (
		<div className="h-[70vh] bg-surface border border-border rounded-brand overflow-hidden">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				onNodeDragStop={handleNodeDragStop}
				onConnect={handleConnect}
				isValidConnection={isValidLinkConnection}
				fitView
			>
				<Background />
			</ReactFlow>
			{pendingConnection && (
				<LinkTypePicker
					onConfirm={handleConfirmLink}
					onCancel={() => setPendingConnection(undefined)}
				/>
			)}
		</div>
	);
};

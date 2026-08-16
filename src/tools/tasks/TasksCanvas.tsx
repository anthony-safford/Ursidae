import React, { useCallback, useEffect, useState } from 'react';
import {
	ReactFlow,
	Background,
	Controls,
	MiniMap,
	Panel,
	ConnectionMode,
	useNodesState,
	useEdgesState,
	MarkerType,
	type Connection,
	type Edge,
	type OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TaskNode, TASK_DRAG_HANDLE_CLASS, type TaskNodeT } from './TaskNode';
import { LinkEdge } from './LinkEdge';
import { LinkTypePicker } from './LinkTypePicker';
import { updateTask } from './tasksApi';
import type { TaskLinkT, TaskLinkTypeT, TaskQuestionT, TaskT } from './tasksModel';

const nodeTypes = { task: TaskNode };
const edgeTypes = { link: LinkEdge };

/** Per-type edge color. `order` also gets a dash pattern on top of its own color — redundant
 * encoding so the type still reads on a hover-sized edge or for colorblind users. */
const LINK_TYPE_COLOR: Record<TaskLinkTypeT, string> = {
	blocks: 'var(--color-danger)',
	related: 'var(--color-accent)',
	order: 'var(--color-warning)',
};

const LINK_TYPE_DASH: Record<TaskLinkTypeT, string | undefined> = {
	blocks: undefined,
	related: undefined,
	order: '6 4',
};

/** Legend rows, in the same order edges are visually distinguished: hierarchy first (it's not a
 * TaskLinkTypeT, so it isn't in LINK_TYPE_COLOR), then the three link types. */
const EDGE_LEGEND: { label: string; color: string; dashed: boolean }[] = [
	{ label: 'Sub-task', color: 'var(--color-text-muted)', dashed: true },
	{ label: 'Blocks', color: LINK_TYPE_COLOR.blocks, dashed: false },
	{ label: 'Related', color: LINK_TYPE_COLOR.related, dashed: false },
	{ label: 'Order', color: LINK_TYPE_COLOR.order, dashed: true },
];

/** Re-themes React Flow's Controls/MiniMap chrome with this app's own tokens via the CSS custom
 * properties those components already read — their light-mode defaults are white-on-white
 * against our dark surface otherwise. */
const canvasThemeStyle = {
	'--xy-controls-button-background-color': 'var(--color-surface)',
	'--xy-controls-button-background-color-hover': 'var(--color-bg)',
	'--xy-controls-button-color': 'var(--color-text-muted)',
	'--xy-controls-button-color-hover': 'var(--color-accent)',
	'--xy-controls-button-border-color': 'var(--color-border)',
	'--xy-minimap-background-color': 'var(--color-surface)',
	'--xy-minimap-mask-background-color': 'rgba(0, 0, 0, 0.4)',
	'--xy-minimap-node-background-color': 'var(--color-accent)',
	'--xy-attribution-background-color': 'var(--color-surface)',
} as React.CSSProperties;

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
	/** Called with a human-readable message when persisting a dragged position fails. */
	onError: (message: string) => void;
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
		// Confines dragging to the card's status band, so clicking a field never starts a drag.
		dragHandle: `.${TASK_DRAG_HANDLE_CLASS}`,
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

/** Maps relationship links to styled, deletable edges anchored to each card's link handles.
 * Each card exposes a source and target handle on both its left and right edge (only the
 * right-source/left-target pair is ever visible; the other pair is invisible and exists purely
 * for this anchoring choice), so the edge can exit/enter whichever side actually faces the other
 * card — rather than always exiting right and entering left regardless of where the cards ended
 * up, which is what caused edges to loop back through the cards themselves. */
export function linksToEdges(
	links: TaskLinkT[],
	onDeleteLink: (id: number) => void,
	tasks: TaskT[]
): Edge[] {
	const taskById = new Map(tasks.map((task) => [task.id, task]));
	return links.map((link) => {
		const color = LINK_TYPE_COLOR[link.type];
		const source = taskById.get(link.sourceTaskId);
		const target = taskById.get(link.targetTaskId);
		const reversed = !!source && !!target && source.positionX > target.positionX;
		return {
			id: `link-${link.id}`,
			type: 'link',
			source: String(link.sourceTaskId),
			target: String(link.targetTaskId),
			sourceHandle: reversed ? 'link-source-left' : 'link-source',
			targetHandle: reversed ? 'link-target-right' : 'link-target',
			style: { stroke: color, strokeWidth: 2, strokeDasharray: LINK_TYPE_DASH[link.type] },
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
	onTaskUpdated: (task: TaskT) => void,
	onError: (message: string) => void
): Promise<void> {
	const id = Number(node.id);
	return updateTask(id, { positionX: node.position.x, positionY: node.position.y })
		.then(onTaskUpdated)
		.catch((error: unknown) => {
			console.error('Failed to persist task position:', error);
			onError(error instanceof Error ? error.message : 'Failed to save the new position.');
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
	onError,
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
		...linksToEdges(links, onDeleteLink, tasks),
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
		setEdges([...tasksToEdges(tasks), ...linksToEdges(links, onDeleteLink, tasks)]);
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
			void persistTaskPosition(node, onTaskUpdated, onError);
		},
		[onTaskUpdated, onError]
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
		<div className="h-full bg-bg overflow-hidden">
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
				connectionMode={ConnectionMode.Loose}
				style={canvasThemeStyle}
				attributionPosition="top-right"
				className="[&_.react-flow__attribution]:!rounded-brand [&_.react-flow__attribution]:!border [&_.react-flow__attribution]:!border-border [&_.react-flow__attribution]:!px-sm [&_.react-flow__attribution]:!py-xs [&_.react-flow__attribution_a]:!text-text-muted"
				fitView
			>
				<Background />
				<Controls className="!rounded-brand !border !border-border !shadow-none overflow-hidden" />
				<MiniMap pannable zoomable className="!rounded-brand !border !border-border" />
				<Panel
					position="top-left"
					className="!rounded-brand !border !border-border !bg-surface !p-sm !text-xs !text-text-muted"
				>
					<ul className="flex flex-col gap-xs">
						{EDGE_LEGEND.map((item) => (
							<li key={item.label} className="flex items-center gap-xs">
								<span
									className="inline-block w-4 border-t-2"
									style={{
										borderColor: item.color,
										borderStyle: item.dashed ? 'dashed' : 'solid',
									}}
								/>
								{item.label}
							</li>
						))}
					</ul>
				</Panel>
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

export type TaskStatusT = 'discovery' | 'research' | 'plan';

/** Human-readable labels for each status, in lifecycle order. */
export const TASK_STATUS_OPTIONS: { value: TaskStatusT; label: string }[] = [
	{ value: 'discovery', label: 'Discovery' },
	{ value: 'research', label: 'Research' },
	{ value: 'plan', label: 'Plan' },
];

export interface TaskT {
	id: number;
	parentId: number | null;
	title: string;
	description: string | null;
	status: TaskStatusT;
	positionX: number;
	positionY: number;
	createdAt: string;
	updatedAt: string;
}

export interface TaskQuestionT {
	id: number;
	taskId: number;
	text: string;
	createdAt: string;
}

export type TaskLinkTypeT = 'blocks' | 'related' | 'order';

/** Human-readable labels for each link type. */
export const TASK_LINK_TYPE_OPTIONS: { value: TaskLinkTypeT; label: string }[] = [
	{ value: 'blocks', label: 'Blocks' },
	{ value: 'related', label: 'Related' },
	{ value: 'order', label: 'Order' },
];

export interface TaskLinkT {
	id: number;
	sourceTaskId: number;
	targetTaskId: number;
	type: TaskLinkTypeT;
	createdAt: string;
}

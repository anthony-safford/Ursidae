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

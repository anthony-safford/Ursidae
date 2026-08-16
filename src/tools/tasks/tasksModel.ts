export type TaskStatusT = 'discovery' | 'research' | 'plan';

/** Human-readable labels for each status, in lifecycle order. */
export const TASK_STATUS_OPTIONS: { value: TaskStatusT; label: string }[] = [
	{ value: 'discovery', label: 'Discovery' },
	{ value: 'research', label: 'Research' },
	{ value: 'plan', label: 'Plan' },
];

/** Per-status accent, shared by the board header's stage chips and each card's status band so the
 * two stay visually tied together. Only accent/warning are real semantic colors — Plan gets a
 * neutral text-muted treatment rather than a fourth hue, per docs/design/foundations.md's "prefer
 * a redundant encoding over inventing hues" rule. */
export const TASK_STATUS_COLOR: Record<
	TaskStatusT,
	{ dot: string; border: string; bg: string; bgHover: string; text: string }
> = {
	discovery: {
		dot: 'bg-accent',
		border: 'border-l-accent',
		bg: 'bg-accent/10',
		bgHover: 'hover:bg-accent/20',
		text: 'text-accent',
	},
	research: {
		dot: 'bg-warning',
		border: 'border-l-warning',
		bg: 'bg-warning/10',
		bgHover: 'hover:bg-warning/20',
		text: 'text-warning',
	},
	plan: {
		dot: 'bg-text-muted',
		border: 'border-l-text-muted',
		bg: 'bg-text-muted/10',
		bgHover: 'hover:bg-text-muted/20',
		text: 'text-text-muted',
	},
};

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

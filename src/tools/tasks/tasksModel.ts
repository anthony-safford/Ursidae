export type TaskStatusT = 'open' | 'in_progress' | 'done';

export interface TaskT {
	id: number;
	parentId: number | null;
	title: string;
	description: string | null;
	questions: string | null;
	status: TaskStatusT;
	positionX: number;
	positionY: number;
	createdAt: string;
	updatedAt: string;
}

import type { TaskT } from './tasksModel';

export interface CreateTaskInputT {
	title: string;
	description?: string | null;
	questions?: string | null;
	status?: TaskT['status'];
	parentId?: number | null;
	positionX?: number;
	positionY?: number;
}

export interface UpdateTaskInputT {
	title?: string;
	description?: string | null;
	questions?: string | null;
	status?: TaskT['status'];
	parentId?: number | null;
	positionX?: number;
	positionY?: number;
}

/** Fetches all tasks. */
export async function getTasks(): Promise<TaskT[]> {
	const response = await fetch('/api/tasks');
	return (await response.json()) as TaskT[];
}

/** Creates a task. */
export async function createTask(input: CreateTaskInputT): Promise<TaskT> {
	const response = await fetch('/api/tasks', {
		method: 'POST',
		// eslint-disable-next-line @typescript-eslint/naming-convention
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	});
	return (await response.json()) as TaskT;
}

/** Updates a task's fields, e.g. its canvas position after a drag. */
export async function updateTask(id: number, input: UpdateTaskInputT): Promise<TaskT> {
	const response = await fetch(`/api/tasks/${id}`, {
		method: 'PATCH',
		// eslint-disable-next-line @typescript-eslint/naming-convention
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	});
	return (await response.json()) as TaskT;
}

/** Deletes a task. */
export async function deleteTask(id: number): Promise<void> {
	await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
}

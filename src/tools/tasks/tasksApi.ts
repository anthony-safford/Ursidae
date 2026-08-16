import type { TaskLinkT, TaskLinkTypeT, TaskQuestionT, TaskT } from './tasksModel';

export interface CreateTaskInputT {
	title: string;
	description?: string | null;
	status?: TaskT['status'];
	parentId?: number | null;
	positionX?: number;
	positionY?: number;
}

export interface UpdateTaskInputT {
	title?: string;
	description?: string | null;
	status?: TaskT['status'];
	parentId?: number | null;
	positionX?: number;
	positionY?: number;
}

export interface CreateTaskQuestionInputT {
	taskId: number;
	text: string;
}

export interface CreateTaskLinkInputT {
	sourceTaskId: number;
	targetTaskId: number;
	type: TaskLinkTypeT;
}

/** Fetches, and throws with the API's own error message on a non-2xx response so callers'
 * `.catch` blocks see real API failures (validation errors, 404s, ...), not just network drops. */
async function fetchOrThrow(input: string, init?: RequestInit): Promise<Response> {
	const response = await fetch(input, init);
	if (!response.ok) {
		const body = (await response.json().catch(() => undefined)) as
			{ error?: { message?: string } } | undefined;
		throw new Error(body?.error?.message ?? `Request failed with status ${response.status}`);
	}
	return response;
}

/** Fetches all tasks. */
export async function getTasks(): Promise<TaskT[]> {
	const response = await fetchOrThrow('/api/tasks');
	return (await response.json()) as TaskT[];
}

/** Creates a task. */
export async function createTask(input: CreateTaskInputT): Promise<TaskT> {
	const response = await fetchOrThrow('/api/tasks', {
		method: 'POST',
		// eslint-disable-next-line @typescript-eslint/naming-convention
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	});
	return (await response.json()) as TaskT;
}

/** Updates a task's fields, e.g. its canvas position after a drag or an inline edit. */
export async function updateTask(id: number, input: UpdateTaskInputT): Promise<TaskT> {
	const response = await fetchOrThrow(`/api/tasks/${id}`, {
		method: 'PATCH',
		// eslint-disable-next-line @typescript-eslint/naming-convention
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	});
	return (await response.json()) as TaskT;
}

/** Deletes a task. */
export async function deleteTask(id: number): Promise<void> {
	await fetchOrThrow(`/api/tasks/${id}`, { method: 'DELETE' });
}

/** Fetches all task questions. */
export async function getTaskQuestions(): Promise<TaskQuestionT[]> {
	const response = await fetchOrThrow('/api/tasks/questions');
	return (await response.json()) as TaskQuestionT[];
}

/** Creates a question on a task. */
export async function createTaskQuestion(input: CreateTaskQuestionInputT): Promise<TaskQuestionT> {
	const response = await fetchOrThrow('/api/tasks/questions', {
		method: 'POST',
		// eslint-disable-next-line @typescript-eslint/naming-convention
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	});
	return (await response.json()) as TaskQuestionT;
}

/** Deletes a question. */
export async function deleteTaskQuestion(id: number): Promise<void> {
	await fetchOrThrow(`/api/tasks/questions/${id}`, { method: 'DELETE' });
}

/** Fetches all task links. */
export async function getTaskLinks(): Promise<TaskLinkT[]> {
	const response = await fetchOrThrow('/api/tasks/links');
	return (await response.json()) as TaskLinkT[];
}

/** Creates a relationship link between two tasks. */
export async function createTaskLink(input: CreateTaskLinkInputT): Promise<TaskLinkT> {
	const response = await fetchOrThrow('/api/tasks/links', {
		method: 'POST',
		// eslint-disable-next-line @typescript-eslint/naming-convention
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	});
	return (await response.json()) as TaskLinkT;
}

/** Deletes a link. */
export async function deleteTaskLink(id: number): Promise<void> {
	await fetchOrThrow(`/api/tasks/links/${id}`, { method: 'DELETE' });
}

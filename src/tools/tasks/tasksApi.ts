import type { TaskT } from './tasksModel';

/** Fetches all tasks. */
export async function getTasks(): Promise<TaskT[]> {
	const response = await fetch('/api/tasks');
	return (await response.json()) as TaskT[];
}

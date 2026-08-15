import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { createTask, updateTask } from './tasksApi';
import type { TaskStatusT, TaskT } from './tasksModel';

interface TaskEditPanelProps {
	/** Task being edited, or undefined to create a new task. */
	task?: TaskT;
	/** Called after the task is successfully created or updated. */
	onSaved: (task: TaskT) => void;
	/** Called when the panel is dismissed without saving. */
	onClose: () => void;
}

const STATUS_OPTIONS: { value: TaskStatusT; label: string }[] = [
	{ value: 'open', label: 'Open' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'done', label: 'Done' },
];

/** Modal form for creating or editing a task's title, description, questions, and status. */
export const TaskEditPanel = ({
	task,
	onSaved,
	onClose,
}: TaskEditPanelProps): React.ReactElement => {
	const [title, setTitle] = useState(task?.title ?? '');
	const [description, setDescription] = useState(task?.description ?? '');
	const [questions, setQuestions] = useState(task?.questions ?? '');
	const [status, setStatus] = useState<TaskStatusT>(task?.status ?? 'open');
	const [saving, setSaving] = useState(false);

	const handleSubmit = (event: React.FormEvent): void => {
		event.preventDefault();
		if (!title.trim()) return;

		setSaving(true);

		const input = {
			title: title.trim(),
			description: description.trim() || null,
			questions: questions.trim() || null,
			status,
		};

		const save = task ? updateTask(task.id, input) : createTask(input);

		save
			.then((saved) => {
				onSaved(saved);
			})
			.catch((error: unknown) => {
				console.error('Failed to save task:', error);
			})
			.finally(() => {
				setSaving(false);
			});
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md">
			<div className="bg-surface border border-border rounded-brand p-lg w-full max-w-md">
				<div className="flex items-center justify-between mb-md">
					<h3 className="text-lg font-semibold">{task ? 'Edit Task' : 'Add Task'}</h3>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="text-text-muted hover:text-accent transition-colors duration-200"
					>
						<X size={20} weight="bold" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-sm">
					<label className="flex flex-col gap-xs">
						<span className="text-xs uppercase tracking-wide text-text-muted">Title</span>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
							className="bg-bg border border-border rounded-brand p-sm text-text"
						/>
					</label>

					<label className="flex flex-col gap-xs">
						<span className="text-xs uppercase tracking-wide text-text-muted">Description</span>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							className="bg-bg border border-border rounded-brand p-sm text-text"
						/>
					</label>

					<label className="flex flex-col gap-xs">
						<span className="text-xs uppercase tracking-wide text-text-muted">Questions</span>
						<textarea
							value={questions}
							onChange={(e) => setQuestions(e.target.value)}
							rows={2}
							className="bg-bg border border-border rounded-brand p-sm text-text"
						/>
					</label>

					<label className="flex flex-col gap-xs">
						<span className="text-xs uppercase tracking-wide text-text-muted">Status</span>
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value as TaskStatusT)}
							className="bg-bg border border-border rounded-brand p-sm text-text"
						>
							{STATUS_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>

					<div className="flex justify-end gap-sm mt-sm">
						<button
							type="button"
							onClick={onClose}
							className="rounded-brand border border-border px-md py-sm uppercase tracking-wide text-sm font-medium text-text-muted hover:text-text transition-colors duration-200"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={saving || !title.trim()}
							className="rounded-brand bg-accent px-md py-sm uppercase tracking-wide text-sm font-medium text-text hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Save
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

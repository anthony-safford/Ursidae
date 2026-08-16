import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { createTask } from './tasksApi';
import { TASK_STATUS_OPTIONS, type TaskStatusT, type TaskT } from './tasksModel';

interface TaskEditPanelProps {
	/** Parent task id for a new sub-task; omit for a top-level task. */
	parentId?: number;
	/** Initial canvas position for the new task. */
	initialPosition?: { x: number; y: number };
	/** Called after the task is successfully created. */
	onSaved: (task: TaskT) => void;
	/** Called when the panel is dismissed without saving. */
	onClose: () => void;
	/** Called with a human-readable message if creation fails. */
	onError: (message: string) => void;
}

/** Modal form for creating a new task or sub-task; editing happens inline on the card itself. */
export const TaskEditPanel = ({
	parentId,
	initialPosition,
	onSaved,
	onClose,
	onError,
}: TaskEditPanelProps): React.ReactElement => {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [status, setStatus] = useState<TaskStatusT>('discovery');
	const [saving, setSaving] = useState(false);

	const handleSubmit = (event: React.FormEvent): void => {
		event.preventDefault();
		if (!title.trim()) return;

		setSaving(true);

		createTask({
			title: title.trim(),
			description: description.trim() || null,
			status,
			parentId,
			positionX: initialPosition?.x,
			positionY: initialPosition?.y,
		})
			.then((saved) => {
				onSaved(saved);
			})
			.catch((error: unknown) => {
				console.error('Failed to save task:', error);
				onError(error instanceof Error ? error.message : 'Failed to save the task.');
			})
			.finally(() => {
				setSaving(false);
			});
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md">
			<div className="bg-surface border border-border rounded-brand p-lg w-full max-w-[28rem]">
				<div className="flex items-center justify-between mb-md">
					<h3 className="text-lg font-semibold">
						{parentId !== undefined ? 'Add Sub-task' : 'Add Task'}
					</h3>
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
							className="w-full bg-bg border border-border rounded-brand p-sm text-text"
						/>
					</label>

					<label className="flex flex-col gap-xs">
						<span className="text-xs uppercase tracking-wide text-text-muted">Description</span>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							className="w-full bg-bg border border-border rounded-brand p-sm text-text"
						/>
					</label>

					<label className="flex flex-col gap-xs">
						<span className="text-xs uppercase tracking-wide text-text-muted">Status</span>
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value as TaskStatusT)}
							className="w-full bg-bg border border-border rounded-brand p-sm text-text"
						>
							{TASK_STATUS_OPTIONS.map((option) => (
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
							className="inline-flex items-center gap-xs rounded-brand bg-accent px-md py-sm uppercase tracking-wide text-sm font-medium text-text hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Save
							<span
								aria-hidden="true"
								className="rounded-brand border border-white/30 px-xs text-xs leading-4"
							>
								↵
							</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

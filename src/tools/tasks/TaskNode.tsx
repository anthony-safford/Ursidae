import React, { useState } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Plus, Trash, X } from '@phosphor-icons/react';
import { TASK_STATUS_OPTIONS, type TaskQuestionT, type TaskT } from './tasksModel';

/** Hidden, non-interactive: only anchors auto-drawn hierarchy edges. Draggable connect handles land in #43. */
const hiddenHandleStyle: React.CSSProperties = { opacity: 0, pointerEvents: 'none' };

export type TaskNodeT = Node<
	{
		task: TaskT;
		/** Questions belonging to this task, pre-filtered by the caller. */
		questions: TaskQuestionT[];
		onDelete: (id: number) => void;
		onAddSubtask: (parentId: number) => void;
		onFieldChange: (
			id: number,
			patch: Partial<Pick<TaskT, 'title' | 'description' | 'status'>>
		) => void;
		onAddQuestion: (taskId: number, text: string) => void;
		onDeleteQuestion: (id: number) => void;
	},
	'task'
>;

/** React Flow node rendering a task card as an inline-editable form, with a question-card list. */
export const TaskNode = ({ data }: NodeProps<TaskNodeT>): React.ReactElement => {
	const {
		task,
		questions,
		onDelete,
		onAddSubtask,
		onFieldChange,
		onAddQuestion,
		onDeleteQuestion,
	} = data;
	const isSubtask = task.parentId !== null;

	const [title, setTitle] = useState(task.title);
	const [description, setDescription] = useState(task.description ?? '');
	const [newQuestion, setNewQuestion] = useState('');

	const handleTitleBlur = (): void => {
		const trimmed = title.trim();
		if (!trimmed) {
			setTitle(task.title);
			return;
		}
		if (trimmed !== task.title) onFieldChange(task.id, { title: trimmed });
	};

	const handleDescriptionBlur = (): void => {
		const trimmed = description.trim();
		if (trimmed !== (task.description ?? '')) {
			onFieldChange(task.id, { description: trimmed || null });
		}
	};

	const handleAddQuestion = (): void => {
		const trimmed = newQuestion.trim();
		if (!trimmed) return;
		onAddQuestion(task.id, trimmed);
		setNewQuestion('');
	};

	return (
		<div
			className={`${isSubtask ? 'w-64 p-sm' : 'w-80 p-md'} flex flex-col gap-xs bg-surface border border-border rounded-brand cursor-grab active:cursor-grabbing`}
		>
			<Handle
				type="target"
				position={Position.Top}
				isConnectable={false}
				style={hiddenHandleStyle}
			/>
			<Handle
				type="source"
				position={Position.Bottom}
				isConnectable={false}
				style={hiddenHandleStyle}
			/>

			<div className="flex items-center gap-xs">
				<input
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					onBlur={handleTitleBlur}
					onMouseDown={(e) => e.stopPropagation()}
					aria-label={`Title for ${task.title}`}
					className="min-w-0 flex-1 rounded-brand bg-transparent px-xs -mx-xs font-semibold focus:bg-bg focus:outline-none"
				/>
				<select
					value={task.status}
					onChange={(e) => onFieldChange(task.id, { status: e.target.value as TaskT['status'] })}
					onMouseDown={(e) => e.stopPropagation()}
					aria-label={`Status for ${task.title}`}
					className="shrink-0 bg-transparent text-xs uppercase tracking-wide text-text-muted focus:outline-none"
				>
					{TASK_STATUS_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				{!isSubtask && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onAddSubtask(task.id);
						}}
						onMouseDown={(e) => e.stopPropagation()}
						aria-label={`Add sub-task to ${task.title}`}
						data-testid={`add-subtask-${task.id}`}
						className="shrink-0 text-text-muted hover:text-accent transition-colors duration-200"
					>
						<Plus size={14} weight="bold" />
					</button>
				)}
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onDelete(task.id);
					}}
					onMouseDown={(e) => e.stopPropagation()}
					aria-label={`Delete ${task.title}`}
					data-testid={`delete-task-${task.id}`}
					className="shrink-0 text-text-muted hover:text-danger transition-colors duration-200"
				>
					<Trash size={14} weight="bold" />
				</button>
			</div>

			<textarea
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				onBlur={handleDescriptionBlur}
				onMouseDown={(e) => e.stopPropagation()}
				placeholder="Description"
				rows={2}
				aria-label={`Description for ${task.title}`}
				className="w-full resize-none rounded-brand bg-transparent px-xs -mx-xs text-sm text-text-muted placeholder:text-text-muted focus:bg-bg focus:outline-none"
			/>

			{questions.length > 0 && (
				<ul className="flex flex-col gap-xs">
					{questions.map((question) => (
						<li
							key={question.id}
							className="flex items-center justify-between gap-xs rounded-brand border border-border bg-bg px-sm py-xs text-xs"
						>
							<span className="min-w-0 break-words">{question.text}</span>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onDeleteQuestion(question.id);
								}}
								onMouseDown={(e) => e.stopPropagation()}
								aria-label={`Remove question: ${question.text}`}
								data-testid={`delete-question-${question.id}`}
								className="shrink-0 text-text-muted hover:text-danger transition-colors duration-200"
							>
								<X size={12} weight="bold" />
							</button>
						</li>
					))}
				</ul>
			)}

			<div className="flex items-center gap-xs">
				<input
					type="text"
					value={newQuestion}
					onChange={(e) => setNewQuestion(e.target.value)}
					onMouseDown={(e) => e.stopPropagation()}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							handleAddQuestion();
						}
					}}
					placeholder="Add a question..."
					aria-label={`Add a question to ${task.title}`}
					className="min-w-0 flex-1 rounded-brand bg-transparent px-xs -mx-xs text-xs placeholder:text-text-muted focus:bg-bg focus:outline-none"
				/>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						handleAddQuestion();
					}}
					onMouseDown={(e) => e.stopPropagation()}
					aria-label={`Add question to ${task.title}`}
					data-testid={`add-question-${task.id}`}
					className="shrink-0 text-text-muted hover:text-accent transition-colors duration-200"
				>
					<Plus size={12} weight="bold" />
				</button>
			</div>
		</div>
	);
};

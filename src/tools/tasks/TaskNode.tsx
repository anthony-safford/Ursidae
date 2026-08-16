import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { CaretDown, X } from '@phosphor-icons/react';
import {
	TASK_STATUS_COLOR,
	TASK_STATUS_OPTIONS,
	type TaskQuestionT,
	type TaskT,
} from './tasksModel';

/** Hidden, non-interactive: only anchors auto-drawn hierarchy edges. */
const hiddenHandleStyle: React.CSSProperties = { opacity: 0, pointerEvents: 'none' };

/** Drag-to-connect handles for links; sized/colored via inline style so they win over React Flow's
 * own handle stylesheet, faded in only on card hover via the `group`/`group-hover` className. */
const linkHandleStyle: React.CSSProperties = {
	width: 10,
	height: 10,
	background: 'var(--color-surface)',
	border: '2px solid var(--color-accent)',
};
const linkHandleClassName = 'opacity-0 transition-opacity group-hover:opacity-100';

/** Marks the card's status band as its drag surface. Passed to React Flow as each node's
 * `dragHandle` selector, so a drag can only start there and clicks elsewhere reach the fields. */
export const TASK_DRAG_HANDLE_CLASS = 'task-card-handle';

/** Rough char count beyond which a 2-line description reads as truncated rather than just short —
 * there's no DOM measurement here, so this is a width/font-size estimate, not an exact wrap point. */
const DESCRIPTION_CLAMP_THRESHOLD = 120;

/** Questions beyond this many are hidden behind the section's expand toggle by default. */
const QUESTIONS_VISIBLE_COUNT = 3;

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

/** React Flow node rendering a task card as a stacked record — status band, body, questions
 * section, action footer — per the "Ledger Block" rendition in docs/design/interaction.md. */
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
	const statusColor = TASK_STATUS_COLOR[task.status];

	const [title, setTitle] = useState(task.title);
	const [description, setDescription] = useState(task.description ?? '');
	const [newQuestion, setNewQuestion] = useState('');
	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
	const [areQuestionsExpanded, setAreQuestionsExpanded] = useState(false);

	const titleInputRef = useRef<HTMLInputElement>(null);
	const [isTitleTruncated, setIsTitleTruncated] = useState(false);

	useEffect(() => {
		const el = titleInputRef.current;
		setIsTitleTruncated(el !== null && el.scrollWidth > el.clientWidth);
	}, [title]);

	const isDescriptionClampable = description.length > DESCRIPTION_CLAMP_THRESHOLD;
	const areQuestionsClampable = questions.length > QUESTIONS_VISIBLE_COUNT;
	const visibleQuestions =
		areQuestionsClampable && !areQuestionsExpanded
			? questions.slice(0, QUESTIONS_VISIBLE_COUNT)
			: questions;

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
		// Outer element sizes the node and hosts the connect handles, which React Flow positions
		// straddling this element's edges — it must not clip, so overflow-hidden (needed to keep the
		// status band's rounded top corners) lives on the inner card element instead.
		<div className={`${isSubtask ? 'w-64' : 'w-80'} group relative`}>
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
			<Handle
				type="target"
				position={Position.Left}
				id="link-target"
				style={linkHandleStyle}
				className={linkHandleClassName}
				aria-label={`Link target for ${task.title}`}
			/>
			<Handle
				type="source"
				position={Position.Right}
				id="link-source"
				style={linkHandleStyle}
				className={linkHandleClassName}
				aria-label={`Link source for ${task.title}`}
			/>
			{/* Invisible, non-interactive: lets a persisted link's rendered edge anchor to whichever
			 * side actually faces the other card, instead of always exiting right/entering left
			 * regardless of layout. Live drag-to-connect already works from either visible handle
			 * above via the canvas's loose connection mode. */}
			<Handle
				type="source"
				position={Position.Left}
				id="link-source-left"
				isConnectable={false}
				style={hiddenHandleStyle}
			/>
			<Handle
				type="target"
				position={Position.Right}
				id="link-target-right"
				isConnectable={false}
				style={hiddenHandleStyle}
			/>

			<div className="flex flex-col overflow-hidden rounded-brand border border-border-lit bg-surface shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
				{/* Status band, and the card's only drag surface (see TASK_DRAG_HANDLE_CLASS). The rest
				 * of the card is fields and buttons, so dragging from anywhere used to mean grabbing a
				 * control by accident; confining drag to this band makes both gestures unambiguous.
				 * Type label left, status right: the band balances end to end, the card says what it is
				 * without relying on its width alone, and the whole span between them — including the
				 * top-left, where a card naturally gets grabbed — stays grab surface, since neither end
				 * is a control that swallows the gesture. */}
				<div
					className={`${TASK_DRAG_HANDLE_CLASS} flex items-center justify-between gap-sm border-b border-border-lit border-l-[3px] ${statusColor.border} ${statusColor.bg} px-sm py-xs cursor-grab active:cursor-grabbing ${statusColor.bgHover} transition-colors duration-200`}
				>
					<span className="shrink-0 text-[10px] uppercase tracking-wider text-text-muted">
						{isSubtask ? 'Sub-task' : 'Task'}
					</span>

					{/* The status label is a plain span, and the real <select> is an invisible overlay on
					 * top of it. An `appearance-none` select mis-measures its own intrinsic width once
					 * letter-spacing is applied, which clipped the longest label ("DISCOVERY") no matter
					 * how much right padding it was given; a span cannot clip, and the overlaid select
					 * still supplies native behaviour, keyboard access and the accessible name. */}
					<div className="relative flex shrink-0 items-center gap-xs rounded-brand focus-within:outline focus-within:outline-1 focus-within:outline-accent">
						<span
							aria-hidden="true"
							className={`text-xs uppercase tracking-wide ${statusColor.text}`}
						>
							{TASK_STATUS_OPTIONS.find((option) => option.value === task.status)?.label}
						</span>
						<CaretDown size={10} weight="bold" className={`shrink-0 ${statusColor.text}`} />
						<select
							value={task.status}
							onChange={(e) =>
								onFieldChange(task.id, { status: e.target.value as TaskT['status'] })
							}
							onMouseDown={(e) => e.stopPropagation()}
							aria-label={`Status for ${task.title}`}
							className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
						>
							{TASK_STATUS_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Body */}
				<div className="flex flex-col gap-xs px-sm py-sm">
					{/* Padding lives on the wrapper, not the input: Chromium fails to render the
					 * text-overflow ellipsis on a padded <input>, hard-clipping instead. */}
					<div className="group/title relative min-w-0 rounded-brand px-xs -mx-xs focus-within:bg-bg">
						<input
							ref={titleInputRef}
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							onBlur={handleTitleBlur}
							onMouseDown={(e) => e.stopPropagation()}
							aria-label={`Title for ${task.title}`}
							className="w-full min-w-0 truncate bg-transparent font-heading text-base focus:outline-none"
						/>
						{isTitleTruncated && (
							<div
								role="tooltip"
								className="pointer-events-none absolute left-0 right-0 top-full z-10 mt-xs whitespace-normal break-words rounded-brand border border-border-lit bg-surface px-xs py-xs text-sm text-text opacity-0 shadow-[0_2px_10px_rgba(0,0,0,0.35)] transition-opacity duration-200 group-hover/title:opacity-100"
							>
								{title}
							</div>
						)}
					</div>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						onBlur={handleDescriptionBlur}
						onFocus={() => setIsDescriptionExpanded(true)}
						onMouseDown={(e) => e.stopPropagation()}
						placeholder="Description"
						rows={isDescriptionExpanded || !isDescriptionClampable ? 6 : 2}
						aria-label={`Description for ${task.title}`}
						className={`w-full resize-none rounded-brand bg-transparent px-xs -mx-xs text-sm text-text-muted placeholder:text-text-muted focus:bg-bg focus:outline-none ${isDescriptionExpanded || !isDescriptionClampable ? '' : 'overflow-hidden'}`}
					/>
					{isDescriptionClampable && (
						<button
							type="button"
							onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
							onMouseDown={(e) => e.stopPropagation()}
							className="self-start text-[10px] uppercase tracking-wide text-text-muted hover:text-accent transition-colors duration-200"
						>
							{isDescriptionExpanded ? 'Show less' : 'Show more'}
						</button>
					)}
				</div>

				{/* Questions: a labelled section of the record, not a pile of separate boxes. */}
				<div className="border-t border-border-lit px-sm">
					<div className="flex items-center justify-between gap-xs pt-sm pb-xs">
						<span className="text-[10px] uppercase tracking-wide text-text-muted">
							Questions · {questions.length}
						</span>
						{areQuestionsClampable && (
							<button
								type="button"
								onClick={() => setAreQuestionsExpanded((expanded) => !expanded)}
								onMouseDown={(e) => e.stopPropagation()}
								aria-label={areQuestionsExpanded ? 'Show fewer questions' : 'Show all questions'}
								className="text-text-muted hover:text-accent transition-colors duration-200"
							>
								<CaretDown
									size={10}
									weight="bold"
									className={`transition-transform duration-200 ${areQuestionsExpanded ? 'rotate-180' : ''}`}
								/>
							</button>
						)}
					</div>

					{questions.length > 0 && (
						<ul className="flex flex-col">
							{visibleQuestions.map((question) => (
								<li
									key={question.id}
									className="flex items-center justify-between gap-xs border-t border-border py-xs text-xs first:border-t-0"
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

					{/* The input row *is* the control, sitting where the new question will land, so it
					 * needs no leading `+`. The trailing `↵` is the submit affordance itself — it names
					 * the keyboard path and is clickable for the pointer one, one glyph doing both jobs.
					 * See docs/design/interaction.md #1 and #2. */}
					<div className="flex items-center gap-xs border-t border-border py-xs text-xs">
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
							className="min-w-0 flex-1 rounded-brand bg-transparent px-xs -mx-xs placeholder:text-text-muted focus:bg-bg focus:outline-none"
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
							className="shrink-0 rounded-brand border border-border-lit px-xs text-[10px] leading-4 text-text-muted hover:border-accent hover:text-accent transition-colors duration-200"
						>
							↵
						</button>
					</div>
				</div>

				{/* Footer: labelled actions, never bare icons — see docs/design/interaction.md #3. */}
				<div className="flex border-t border-border-lit">
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
							className="flex-1 border-r border-border-lit py-xs text-xs uppercase tracking-wide text-text-muted hover:text-accent hover:bg-white/5 transition-colors duration-200"
						>
							↳ Sub-task
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
						className="flex-1 py-xs text-xs uppercase tracking-wide text-danger/80 hover:text-danger hover:bg-white/5 transition-colors duration-200"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};

import React from 'react';
import { CaretRight } from '@phosphor-icons/react';
import { TASK_STATUS_COLOR, TASK_STATUS_OPTIONS, type TaskStatusT } from './tasksModel';

/** Board-wide counts the header summarizes. `undefined` while tasks/questions/links are loading. */
export interface TasksBoardStatsT {
	total: number;
	discovery: number;
	research: number;
	plan: number;
	questions: number;
	links: number;
}

interface TasksBoardHeaderProps {
	/** Board stats to summarize, or `undefined` while the initial fetch is still in flight. */
	stats: TasksBoardStatsT | undefined;
	/** The status currently isolated on the canvas, or `undefined` when showing everything. */
	statusFilter: TaskStatusT | undefined;
	/** Called with the status a chip represents, or `undefined` for the "on board" chip. */
	onFilterChange: (status: TaskStatusT | undefined) => void;
	/** Opens the Add Task panel. */
	onAddTask: () => void;
}

/** Single-line status bar attached to the top of the canvas panel: board name, live counts as
 * toggle chips that isolate a stage on the canvas, and the primary Add Task action. Replaces a
 * standalone heading + description sentence that used to sit above the canvas as its own box. */
export const TasksBoardHeader = ({
	stats,
	statusFilter,
	onFilterChange,
	onAddTask,
}: TasksBoardHeaderProps): React.ReactElement => {
	return (
		<div className="flex flex-wrap items-center gap-sm rounded-t-brand border border-b-0 border-border-lit bg-surface px-md py-sm text-xs">
			<CaretRight size={12} weight="bold" className="shrink-0 text-accent" aria-hidden="true" />
			<h2 className="mr-xs shrink-0 font-heading text-base font-normal text-text">Tasks</h2>

			{stats && (
				<div className="flex flex-1 flex-wrap items-center gap-sm text-text-muted [font-variant-numeric:tabular-nums]">
					<StatusChip
						label="on board"
						count={stats.total}
						active={statusFilter === undefined}
						ariaLabel="Show all tasks"
						onClick={() => onFilterChange(undefined)}
					/>
					<Separator />
					{TASK_STATUS_OPTIONS.map((option, index) => (
						<React.Fragment key={option.value}>
							{index > 0 && <span className="text-text-muted/50">·</span>}
							<StatusChip
								label={option.label}
								count={stats[option.value]}
								dotClassName={TASK_STATUS_COLOR[option.value].dot}
								active={statusFilter === option.value}
								ariaLabel={`Isolate ${option.label} tasks on the canvas`}
								onClick={() => onFilterChange(option.value)}
							/>
						</React.Fragment>
					))}
					<Separator />
					<span>
						<b className="font-semibold text-text">{stats.questions}</b> questions
					</span>
					<Separator />
					<span>
						<b className="font-semibold text-text">{stats.links}</b> links
					</span>
				</div>
			)}

			{stats && (
				<button
					type="button"
					onClick={onAddTask}
					className="ml-auto shrink-0 rounded-brand bg-accent px-sm py-xs uppercase tracking-wide text-xs font-medium text-text hover:bg-accent-hover transition-colors duration-200"
				>
					Add Task
				</button>
			)}
		</div>
	);
};

const Separator = (): React.ReactElement => (
	<span aria-hidden="true" className="text-border-lit">
		·
	</span>
);

interface StatusChipProps {
	label: string;
	count: number;
	active: boolean;
	ariaLabel: string;
	onClick: () => void;
	dotClassName?: string;
}

/** Toggle chip reusing the app's established active state — an accent border plus a faint tint,
 * see docs/design/foundations.md's "active nav/tab state" rule — rather than a filled pill. */
const StatusChip = ({
	label,
	count,
	active,
	ariaLabel,
	onClick,
	dotClassName,
}: StatusChipProps): React.ReactElement => (
	<button
		type="button"
		onClick={onClick}
		aria-pressed={active}
		aria-label={ariaLabel}
		className={`inline-flex items-center gap-xs rounded-brand border px-xs py-[1px] transition-colors duration-200 ${
			active
				? 'border-accent bg-accent/10 text-text'
				: 'border-border-lit text-text-muted hover:border-accent/50 hover:text-text'
		}`}
	>
		{dotClassName && (
			<span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-[1px] ${dotClassName}`} />
		)}
		<b className="font-semibold text-text">{count}</b> {label}
	</button>
);

import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { TASK_LINK_TYPE_OPTIONS, type TaskLinkTypeT } from './tasksModel';

interface LinkTypePickerProps {
	/** Called with the chosen type when the user confirms. */
	onConfirm: (type: TaskLinkTypeT) => void;
	/** Called when the picker is dismissed without confirming. */
	onCancel: () => void;
}

/** Small modal prompting for a relationship type right after a link is drawn, before it's persisted. */
export const LinkTypePicker = ({
	onConfirm,
	onCancel,
}: LinkTypePickerProps): React.ReactElement => {
	const [type, setType] = useState<TaskLinkTypeT>('related');

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md">
			<div className="bg-surface border border-border rounded-brand p-lg w-full max-w-[20rem]">
				<div className="flex items-center justify-between mb-md">
					<h3 className="text-lg font-semibold">Link type</h3>
					<button
						type="button"
						onClick={onCancel}
						aria-label="Close"
						className="text-text-muted hover:text-accent transition-colors duration-200"
					>
						<X size={20} weight="bold" />
					</button>
				</div>

				<div role="radiogroup" aria-label="Link type" className="flex flex-col gap-xs">
					{TASK_LINK_TYPE_OPTIONS.map((option) => (
						<label
							key={option.value}
							className="flex items-center gap-sm rounded-brand border border-border p-sm cursor-pointer hover:bg-bg"
						>
							<input
								type="radio"
								name="link-type"
								value={option.value}
								checked={type === option.value}
								onChange={() => setType(option.value)}
							/>
							<span>{option.label}</span>
						</label>
					))}
				</div>

				<div className="flex justify-end gap-sm mt-md">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-brand border border-border px-md py-sm uppercase tracking-wide text-sm font-medium text-text-muted hover:text-text transition-colors duration-200"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => onConfirm(type)}
						className="rounded-brand bg-accent px-md py-sm uppercase tracking-wide text-sm font-medium text-text hover:bg-accent-hover transition-colors duration-200"
					>
						Add
					</button>
				</div>
			</div>
		</div>
	);
};

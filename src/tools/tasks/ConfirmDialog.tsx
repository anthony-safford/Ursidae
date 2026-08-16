import React from 'react';
import { X } from '@phosphor-icons/react';

interface ConfirmDialogProps {
	/** Dialog heading. */
	title: string;
	/** Body copy explaining the consequences of confirming. */
	message: string;
	/** Label for the destructive confirm button. */
	confirmLabel: string;
	/** Called when the confirm button is clicked. */
	onConfirm: () => void;
	/** Called when the dialog is dismissed without confirming. */
	onCancel: () => void;
}

/** Modal confirmation step for destructive actions, e.g. deleting a task and its sub-tasks. */
export const ConfirmDialog = ({
	title,
	message,
	confirmLabel,
	onConfirm,
	onCancel,
}: ConfirmDialogProps): React.ReactElement => {
	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md">
			<div className="bg-surface border border-border rounded-brand p-lg w-full max-w-[24rem]">
				<div className="flex items-center justify-between mb-md">
					<h3 className="text-lg font-semibold">{title}</h3>
					<button
						type="button"
						onClick={onCancel}
						aria-label="Close"
						className="text-text-muted hover:text-accent transition-colors duration-200"
					>
						<X size={20} weight="bold" />
					</button>
				</div>

				<p className="text-sm text-text-muted">{message}</p>

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
						onClick={onConfirm}
						className="rounded-brand bg-danger px-md py-sm uppercase tracking-wide text-sm font-medium text-text hover:bg-danger-hover transition-colors duration-200"
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
};

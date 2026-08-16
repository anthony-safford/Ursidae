import React from 'react';
import { X } from '@phosphor-icons/react';

interface ErrorBannerProps {
	/** Human-readable message describing the failed persistence call. */
	message: string;
	/** Called when the banner's dismiss button is clicked. */
	onDismiss: () => void;
}

/** Dismissible banner surfacing a failed persistence call, so a failure isn't silent. */
export const ErrorBanner = ({ message, onDismiss }: ErrorBannerProps): React.ReactElement => {
	return (
		<div
			role="alert"
			className="flex items-center justify-between gap-sm rounded-brand border border-danger bg-danger/10 px-md py-sm mb-md text-sm text-danger"
		>
			<span>{message}</span>
			<button
				type="button"
				onClick={onDismiss}
				aria-label="Dismiss error"
				className="shrink-0 text-danger hover:text-danger-hover transition-colors duration-200"
			>
				<X size={14} weight="bold" />
			</button>
		</div>
	);
};

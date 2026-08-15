import React from 'react';
import { DotsSixVertical } from '@phosphor-icons/react';

export interface TileProps {
	/** Tile header title. */
	title: string;
	/** Tile body content. */
	children: React.ReactNode;
	/** Current interaction, if this tile is the one being dragged or resized. */
	mode?: 'dragging' | 'resizing';
}

/** Equal-size dashboard tile with a drag handle and a resize corner. */
export const Tile = ({ title, children, mode }: TileProps): React.ReactElement => {
	return (
		<div
			className={`h-full w-full flex flex-col relative bg-surface border rounded-brand p-md transition-shadow duration-200 ${
				mode ? 'border-accent' : 'border-border'
			} ${mode === 'dragging' ? 'shadow-lg' : ''}`}
		>
			<div className="flex items-center justify-between mb-sm">
				<span className="text-sm font-semibold text-text select-none">{title}</span>
				<span className="tile-grip cursor-grab text-text-muted hover:text-accent transition-colors duration-200">
					<DotsSixVertical size={16} weight="bold" />
				</span>
			</div>
			<div className="flex-1 text-sm text-text-muted overflow-hidden">{children}</div>
		</div>
	);
};

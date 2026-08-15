import React from 'react';
import {
	BaseEdge,
	EdgeLabelRenderer,
	getBezierPath,
	type EdgeProps,
	type Edge,
} from '@xyflow/react';
import { X } from '@phosphor-icons/react';

export type LinkEdgeT = Edge<{ linkId: number; onDelete: (id: number) => void }, 'link'>;

/** Custom edge for relationship links: styled path plus a delete button floating at its midpoint. */
export const LinkEdge = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style,
	markerEnd,
	data,
}: EdgeProps<LinkEdgeT>): React.ReactElement => {
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	return (
		<>
			<BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
			<EdgeLabelRenderer>
				<button
					type="button"
					style={{
						position: 'absolute',
						transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
						pointerEvents: 'all',
					}}
					onClick={() => data?.onDelete(data.linkId)}
					aria-label="Delete link"
					data-testid={`delete-link-${data?.linkId}`}
					className="nodrag nopan flex h-4 w-4 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-danger transition-colors duration-200"
				>
					<X size={10} weight="bold" />
				</button>
			</EdgeLabelRenderer>
		</>
	);
};

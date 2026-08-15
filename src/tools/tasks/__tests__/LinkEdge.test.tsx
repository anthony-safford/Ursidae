import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReactFlow, Position } from '@xyflow/react';
import { LinkEdge } from '../LinkEdge';

/**
 * Mounted directly inside an otherwise-empty `<ReactFlow>` shell rather than through
 * `TasksCanvas`'s normal nodes/edges pipeline: React Flow only draws an edge once it has
 * measured both endpoint nodes via ResizeObserver, which this project's jsdom test setup mocks
 * as a no-op (see `src/test/setup.ts`), so edges never actually render through that path in
 * tests. Rendering the edge component directly, with explicit coordinates, sidesteps that
 * measurement pipeline while still giving `EdgeLabelRenderer` the real portal target it needs.
 */
function renderLinkEdge(onDelete: (id: number) => void): void {
	render(
		<ReactFlow nodes={[]} edges={[]}>
			<LinkEdge
				id="link-1"
				source="1"
				target="2"
				sourceX={0}
				sourceY={0}
				targetX={100}
				targetY={100}
				sourcePosition={Position.Right}
				targetPosition={Position.Left}
				style={{ stroke: 'var(--color-accent)' }}
				markerEnd={undefined}
				data={{ linkId: 1, onDelete }}
			/>
		</ReactFlow>
	);
}

describe('LinkEdge', () => {
	it('renders a delete button calling onDelete with the link id', () => {
		const onDelete = vi.fn();
		renderLinkEdge(onDelete);

		fireEvent.click(screen.getByTestId('delete-link-1'));

		expect(onDelete).toHaveBeenCalledWith(1);
	});
});

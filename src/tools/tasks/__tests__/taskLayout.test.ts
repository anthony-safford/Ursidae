import { describe, expect, it } from 'vitest';
import { CARD_FOOTPRINT, findFreeTaskPosition } from '../taskLayout';

/** Builds a placed-task stub at the given coordinates. */
function createTaskAt(x: number, y: number): { positionX: number; positionY: number } {
	return { positionX: x, positionY: y };
}

describe('findFreeTaskPosition', () => {
	it('places the first card at the origin when the canvas is empty', () => {
		expect(findFreeTaskPosition([])).toEqual({ x: 0, y: 0 });
	});

	it('moves along the row when the origin is taken', () => {
		const position = findFreeTaskPosition([createTaskAt(0, 0)]);

		expect(position.y).toBe(0);
		expect(position.x).toBeGreaterThanOrEqual(CARD_FOOTPRINT.width);
	});

	it('never returns a position overlapping an existing card', () => {
		const existing = [createTaskAt(0, 0), createTaskAt(352, 0), createTaskAt(704, 0)];

		const position = findFreeTaskPosition(existing);

		for (const task of existing) {
			const overlaps =
				Math.abs(position.x - task.positionX) < CARD_FOOTPRINT.width &&
				Math.abs(position.y - task.positionY) < CARD_FOOTPRINT.height;
			expect(overlaps).toBe(false);
		}
	});

	it('wraps to a lower row once the first row is full', () => {
		// Five columns at the default step of 352px fills the row the scan tries first.
		const fullRow = [0, 1, 2, 3, 4].map((column) => createTaskAt(column * 352, 0));

		const position = findFreeTaskPosition(fullRow);

		expect(position.y).toBeGreaterThanOrEqual(CARD_FOOTPRINT.height);
	});

	it('reuses a gap left in the middle of a row before growing the canvas', () => {
		// Column 1 is free; columns 0, 2, 3, 4 are taken.
		const rowWithGap = [0, 2, 3, 4].map((column) => createTaskAt(column * 352, 0));

		const position = findFreeTaskPosition(rowWithGap);

		expect(position).toEqual({ x: 352, y: 0 });
	});

	it('anchors the search at a preferred position when one is given', () => {
		expect(findFreeTaskPosition([], { x: 900, y: 500 })).toEqual({ x: 900, y: 500 });
	});

	it('searches outward from the preferred position when it is occupied', () => {
		const preferred = { x: 900, y: 500 };

		const position = findFreeTaskPosition([createTaskAt(900, 500)], preferred);

		expect(position).not.toEqual(preferred);
		expect(position.x).toBeGreaterThanOrEqual(preferred.x);
		expect(position.y).toBeGreaterThanOrEqual(preferred.y);
	});

	it('keeps two sub-tasks of the same parent from stacking on each other', () => {
		const parentAnchor = { x: 60, y: 260 };
		const first = findFreeTaskPosition([createTaskAt(0, 0)], parentAnchor);
		const second = findFreeTaskPosition(
			[createTaskAt(0, 0), createTaskAt(first.x, first.y)],
			parentAnchor
		);

		expect(second).not.toEqual(first);
	});
});

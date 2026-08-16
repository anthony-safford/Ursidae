/** Nominal card footprint used for placement collision checks. Real cards vary in height with
 * their question count, so this is deliberately generous — new cards should land in visibly clear
 * space rather than in exactly-tight gaps. */
export const CARD_FOOTPRINT = { width: 320, height: 260 };

/** Breathing room left between a newly placed card and any existing one. */
const PLACEMENT_GAP = 32;

/** Candidate columns tried before wrapping to the next row. */
const PLACEMENT_COLUMNS = 5;

/** Rows to try before giving up and stacking at the origin (effectively never reached). */
const PLACEMENT_ROWS = 40;

interface PositionT {
	x: number;
	y: number;
}

interface PlacedTaskT {
	positionX: number;
	positionY: number;
}

/** True when a card placed at `candidate` would overlap `task`'s nominal footprint, including the
 * placement gap on every side. */
function doesOverlap(candidate: PositionT, task: PlacedTaskT): boolean {
	const spanX = CARD_FOOTPRINT.width + PLACEMENT_GAP;
	const spanY = CARD_FOOTPRINT.height + PLACEMENT_GAP;

	return (
		candidate.x < task.positionX + spanX &&
		candidate.x + spanX > task.positionX &&
		candidate.y < task.positionY + spanY &&
		candidate.y + spanY > task.positionY
	);
}

/**
 * Picks a position for a new card that doesn't land on top of an existing one.
 *
 * Scans a grid anchored at `preferred` (or the origin), left to right then top to bottom, and
 * returns the first slot clear of every existing card. Because the scan starts at the anchor and
 * only moves outward, a sub-task still appears next to its parent, and gaps left by moved or
 * deleted cards get reused before the canvas grows.
 */
export function findFreeTaskPosition(
	existingTasks: PlacedTaskT[],
	preferred?: PositionT
): PositionT {
	const origin = preferred ?? { x: 0, y: 0 };
	const stepX = CARD_FOOTPRINT.width + PLACEMENT_GAP;
	const stepY = CARD_FOOTPRINT.height + PLACEMENT_GAP;

	for (let row = 0; row < PLACEMENT_ROWS; row++) {
		for (let column = 0; column < PLACEMENT_COLUMNS; column++) {
			const slot = { x: origin.x + column * stepX, y: origin.y + row * stepY };
			if (!existingTasks.some((task) => doesOverlap(slot, task))) return slot;
		}
	}

	return origin;
}

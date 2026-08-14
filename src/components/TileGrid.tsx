import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactGridLayout, { useContainerWidth } from 'react-grid-layout';
import type { Layout, LayoutItem } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Plus, Trash } from '@phosphor-icons/react';
import './tileGridOverrides.css';
import { Tile } from './Tile';

export interface TileDefinition {
	/** Stable identifier matching the tile's grid layout item. */
	id: string;
	/** Tile header title. */
	title: string;
	/** Tile body content. */
	content: React.ReactNode;
	/** Column span override for this tile; defaults to the grid's tileWidth. */
	w?: number;
	/** Row span override for this tile; defaults to the grid's tileHeight. */
	h?: number;
	/** Minimum column span for this tile when resizing; defaults to no minimum. */
	minW?: number;
	/** Minimum row span for this tile when resizing; defaults to no minimum. */
	minH?: number;
}

interface TileGridProps {
	/** Tiles to render, placed left-to-right then top-to-bottom in equal-size slots. */
	tiles: TileDefinition[];
	/** Number of grid columns tiles are placed on. */
	cols?: number;
	/** Column span for each equally-sized tile. */
	tileWidth?: number;
	/** Row span for each equally-sized tile. */
	tileHeight?: number;
	/** Optional content rendered at the start of the toolbar row, alongside the built-in add/delete controls. */
	toolbarStart?: React.ReactNode;
	/** Optional content rendered at the end of the toolbar row, after the built-in add/delete controls. */
	toolbarEnd?: React.ReactNode;
}

const ROW_HEIGHT = 140;
const GRID_MARGIN: readonly [number, number] = [16, 16];
const REMOVE_ANIMATION_MS = 200;

const createInitialLayout = (
	tiles: TileDefinition[],
	cols: number,
	tileWidth: number,
	tileHeight: number
): Layout => {
	let x = 0;
	let y = 0;
	let rowHeight = tileHeight;

	return tiles.map((tile) => {
		const w = tile.w ?? tileWidth;
		const h = tile.h ?? tileHeight;

		if (x + w > cols) {
			x = 0;
			y += rowHeight;
			rowHeight = h;
		} else {
			rowHeight = Math.max(rowHeight, h);
		}

		const item: LayoutItem = {
			i: tile.id,
			x,
			y,
			w,
			h,
			minW: tile.minW,
			minH: tile.minH,
		};
		x += w;
		return item;
	});
};

/** Equal-size dashboard tile grid — tiles can be dragged to reorder and resized from the corner. */
export const TileGrid = ({
	tiles,
	cols = 12,
	tileWidth = 4,
	tileHeight = 1,
	toolbarStart,
	toolbarEnd,
}: TileGridProps): React.ReactElement => {
	const { width, containerRef, mounted } = useContainerWidth();
	const gridContainerRef = useRef<HTMLDivElement>(null);
	const [activeTileIds, setActiveTileIds] = useState<Set<string>>(
		() => new Set(tiles.map((t) => t.id))
	);
	const [layout, setLayout] = useState<Layout>(() =>
		createInitialLayout(tiles, cols, tileWidth, tileHeight)
	);
	const [activeId, setActiveId] = useState<string | undefined>();
	const [activeMode, setActiveMode] = useState<'dragging' | 'resizing' | undefined>();
	const [deleteMode, setDeleteMode] = useState(false);
	const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
	const [addMenuOpen, setAddMenuOpen] = useState(false);

	// Map activeTileIds to the corresponding catalog tiles
	const activeTiles = useMemo(
		() => tiles.filter((tile) => activeTileIds.has(tile.id)),
		[tiles, activeTileIds]
	);

	// Map inactiveTileIds to the corresponding catalog tiles
	const inactiveTiles = useMemo(
		() => tiles.filter((tile) => !activeTileIds.has(tile.id)),
		[tiles, activeTileIds]
	);

	// Escape or clicking truly outside the grid container exits delete/add modes.
	useEffect(() => {
		if (!deleteMode && !addMenuOpen) return undefined;

		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === 'Escape') {
				setDeleteMode(false);
				setAddMenuOpen(false);
			}
		};

		const handlePointerDown = (event: PointerEvent): void => {
			const gridContainer = gridContainerRef.current;
			if (!gridContainer) return;

			// If the click is inside the grid container, do not exit mode
			if (gridContainer.contains(event.target as Node)) return;

			// Click was outside; exit modes
			setDeleteMode(false);
			setAddMenuOpen(false);
		};

		window.addEventListener('keydown', handleKeyDown);
		document.addEventListener('pointerdown', handlePointerDown);
		return (): void => {
			window.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('pointerdown', handlePointerDown);
		};
	}, [deleteMode, addMenuOpen]);

	const handleDragStart = (
		_layout: Layout,
		_oldItem: LayoutItem | null,
		newItem: LayoutItem | null
	): void => {
		setActiveId(newItem?.i);
		setActiveMode('dragging');
	};

	const handleResizeStart = (
		_layout: Layout,
		_oldItem: LayoutItem | null,
		newItem: LayoutItem | null
	): void => {
		setActiveId(newItem?.i);
		setActiveMode('resizing');
	};

	const handleInteractionStop = (): void => {
		setActiveId(undefined);
		setActiveMode(undefined);
	};

	const handleToggleDeleteMode = (): void => {
		setDeleteMode((prev) => !prev);
		setAddMenuOpen(false);
	};

	const handleToggleAddMenu = (): void => {
		setAddMenuOpen((prev) => !prev);
		setDeleteMode(false);
	};

	const handleDeleteTile = (id: string): void => {
		if (!deleteMode) return;

		setRemovingIds((prev) => new Set(prev).add(id));
		window.setTimeout(() => {
			setActiveTileIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
			setLayout((prev) => prev.filter((item) => item.i !== id));
			setRemovingIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		}, REMOVE_ANIMATION_MS);
	};

	const handleReactivateTile = (tileId: string): void => {
		setAddMenuOpen(false);

		const tile = tiles.find((t) => t.id === tileId);
		if (!tile) return;

		setActiveTileIds((prev) => new Set(prev).add(tileId));

		// Add to layout at the end (wrapping placement)
		const perRow = Math.max(1, Math.floor(cols / tileWidth));
		const index = activeTiles.length;
		const newItem: LayoutItem = {
			i: tileId,
			x: (index % perRow) * tileWidth,
			y: Math.floor(index / perRow) * tileHeight,
			w: tile.w ?? tileWidth,
			h: tile.h ?? tileHeight,
			minW: tile.minW,
			minH: tile.minH,
		};

		setLayout((prev) => [...prev, newItem]);
	};

	return (
		<div ref={gridContainerRef}>
			<div className="flex justify-between items-center gap-sm px-md mb-sm">
				<div className="flex items-center gap-sm">{toolbarStart}</div>
				<div className="flex items-center gap-sm">
					<div className="relative">
						<button
							type="button"
							onClick={handleToggleAddMenu}
							disabled={inactiveTiles.length === 0}
							aria-label="Add tile"
							aria-disabled={inactiveTiles.length === 0}
							className={`flex h-8 w-8 items-center justify-center rounded-brand text-text shadow-md transition-colors duration-200 ${
								inactiveTiles.length === 0
									? 'bg-surface border border-border text-text-muted cursor-not-allowed'
									: 'bg-accent hover:bg-accent-hover'
							}`}
						>
							<Plus size={16} weight="bold" />
						</button>
						{addMenuOpen && inactiveTiles.length > 0 && (
							<div className="absolute right-0 top-full mt-xs z-50 bg-surface border border-border rounded-brand shadow-lg min-w-48 py-xs">
								{inactiveTiles.map((tile) => (
									<button
										key={tile.id}
										type="button"
										onClick={() => handleReactivateTile(tile.id)}
										className="w-full text-left px-md py-xs text-sm text-text hover:text-accent transition-colors duration-200"
									>
										{tile.title}
									</button>
								))}
							</div>
						)}
					</div>
					<button
						type="button"
						onClick={handleToggleDeleteMode}
						aria-label={deleteMode ? 'Exit delete mode' : 'Delete tiles'}
						aria-pressed={deleteMode}
						className={`flex h-8 w-8 items-center justify-center rounded-brand shadow-md transition-colors duration-200 ${
							deleteMode
								? 'bg-danger text-text'
								: 'border border-border text-danger hover:bg-danger hover:text-text'
						}`}
					>
						<Trash size={16} weight="bold" />
					</button>
					{toolbarEnd && <div className="flex items-center gap-sm">{toolbarEnd}</div>}
				</div>
			</div>
			{/* react-grid-layout's bundled types target React 19's nullable RefObject; cast for @types/react 18. */}
			<div
				ref={containerRef as React.RefObject<HTMLDivElement>}
				className={activeMode ? 'select-none' : undefined}
			>
				{mounted && (
					<ReactGridLayout
						width={width}
						layout={layout}
						gridConfig={{ cols, rowHeight: ROW_HEIGHT, margin: GRID_MARGIN }}
						dragConfig={{ handle: '.tile-grip', enabled: !deleteMode }}
						resizeConfig={{ handles: ['se'], enabled: !deleteMode }}
						onLayoutChange={setLayout}
						onDragStart={handleDragStart}
						onDragStop={handleInteractionStop}
						onResizeStart={handleResizeStart}
						onResizeStop={handleInteractionStop}
					>
						{activeTiles.map((tile) => (
							<div key={tile.id}>
								<div
									className={`relative h-full transition-all duration-200 ease-in ${
										removingIds.has(tile.id) ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
									}`}
								>
									<Tile title={tile.title} mode={activeId === tile.id ? activeMode : undefined}>
										{tile.content}
									</Tile>
									{deleteMode && (
										<button
											type="button"
											onClick={() => handleDeleteTile(tile.id)}
											onMouseDown={(e) => e.stopPropagation()}
											aria-label={`Delete ${tile.title} tile`}
											className="absolute top-md right-md z-20 flex h-8 w-8 items-center justify-center rounded-brand bg-danger text-text shadow-md hover:bg-danger-hover transition-colors duration-200"
										>
											<Trash size={16} weight="bold" />
										</button>
									)}
								</div>
							</div>
						))}
					</ReactGridLayout>
				)}
			</div>
		</div>
	);
};

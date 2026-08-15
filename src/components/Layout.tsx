import React from 'react';
import { Link } from 'wouter';
import { GearSix, MagnifyingGlass, UserCircle } from '@phosphor-icons/react';
import { Nav } from './Nav';

/** Layout wrapper component providing site-wide header and content structure. */
export const Layout = ({ children }: { children: React.ReactNode }): React.ReactElement => {
	return (
		<>
			<header className="bg-surface border-b border-border">
				<div className="flex flex-wrap items-center gap-md px-md py-sm">
					<Link href="/" className="no-underline text-inherit">
						<h1 className="m-0 text-2xl font-bold text-text">Urisdae</h1>
					</Link>
					<Nav />
					<div className="flex items-center gap-md ml-auto">
						<button
							type="button"
							className="flex items-center gap-sm rounded-brand border border-border px-sm py-xs text-text-muted hover:text-accent hover:border-accent transition-colors duration-200"
						>
							<MagnifyingGlass size={16} weight="regular" />
							<span className="text-xs uppercase tracking-wide">⌘K</span>
						</button>
						<button
							type="button"
							aria-label="Settings"
							className="text-text-muted hover:text-accent transition-colors duration-200"
						>
							<GearSix size={20} weight="regular" />
						</button>
						<UserCircle size={28} weight="regular" className="text-text-muted" />
					</div>
				</div>
			</header>
			<main className="px-md py-lg">{children}</main>
		</>
	);
};

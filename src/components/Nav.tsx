import React from 'react';
import { Link, useRoute } from 'wouter';
import { toolRegistry } from '../routes/toolRegistry';

/** Breadcrumb-style navigation listing the registered tool pages beside the site title. */
export const Nav = (): React.ReactElement => {
	const entries = Object.entries(toolRegistry);

	return (
		<nav className="flex flex-wrap items-center gap-xs text-sm font-body">
			{entries.map(([slug, entry]) => (
				<NavLink key={slug} href={`/tools/${slug}`} label={entry.label} />
			))}
		</nav>
	);
};

interface NavLinkProps {
	/** The href path for the link. */
	href: string;
	/** The display label for the link. */
	label: string;
}

/** Individual nav link — active state is a left accent border with a tinted background. */
const NavLink = ({ href, label }: NavLinkProps): React.ReactElement => {
	const [isActive] = useRoute(href);

	return (
		<Link
			href={href}
			className={`no-underline uppercase tracking-wide border-l-2 px-sm transition-colors duration-200 ${
				isActive
					? 'border-accent bg-accent/10 text-accent font-semibold'
					: 'border-transparent text-text-muted hover:text-accent hover:bg-accent/5'
			}`}
		>
			{label}
		</Link>
	);
};

import React from 'react';
import { Link, useRoute } from 'wouter';
import { toolRegistry } from '../routes/toolRegistry';

/** Navigation bar component with links to all tools. */
export const Nav = (): React.ReactElement => {
	return (
		<nav className="flex flex-wrap items-center gap-6 px-4 py-3 border-t border-gray-200">
			<NavLink href="/" label="Home" />
			{Object.entries(toolRegistry).map(([slug, entry]) => (
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

/** Individual navigation link with active state highlighting. */
const NavLink = ({ href, label }: NavLinkProps): React.ReactElement => {
	const [isActive] = useRoute(href);

	return (
		<Link
			href={href}
			className={`no-underline font-medium transition-colors duration-200 ${
				isActive ? 'text-blue-600 underline font-bold' : 'text-gray-700 hover:text-blue-500'
			}`}
		>
			{label}
		</Link>
	);
};

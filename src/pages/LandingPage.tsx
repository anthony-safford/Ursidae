import React from 'react';
import { Link } from 'wouter';
import { toolRegistry } from '../routes/toolRegistry';

/** Landing page listing all available tools. */
export const LandingPage = (): React.ReactElement => {
	return (
		<div className="p-lg">
			<h2 className="text-2xl font-bold mb-lg">Available Tools</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
				{Object.entries(toolRegistry).map(([slug, entry]) => (
					<Link
						key={slug}
						href={`/tools/${slug}`}
						className="p-md bg-surface border border-border rounded-brand hover:border-accent no-underline text-inherit block cursor-pointer transition-colors duration-200"
					>
						<h3 className="m-0 mb-sm text-lg font-semibold text-text">{entry.label}</h3>
						<p className="m-0 text-sm text-text-muted">Click to open</p>
					</Link>
				))}
			</div>
		</div>
	);
};

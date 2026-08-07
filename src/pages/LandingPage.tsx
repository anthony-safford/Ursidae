import React from 'react';
import { Link } from 'wouter';
import { toolRegistry } from '../routes/toolRegistry';

/** Landing page listing all available tools. */
export const LandingPage = (): React.ReactElement => {
	return (
		<div className="p-8">
			<h2 className="text-2xl font-bold mb-6">Available Tools</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{Object.entries(toolRegistry).map(([slug, entry]) => (
					<Link
						key={slug}
						href={`/tools/${slug}`}
						className="p-4 border border-gray-300 rounded hover:bg-gray-100 no-underline text-inherit block cursor-pointer transition-colors duration-200"
					>
						<h3 className="m-0 mb-2 text-lg font-semibold">{entry.label}</h3>
						<p className="m-0 text-sm text-gray-600">Click to open</p>
					</Link>
				))}
			</div>
		</div>
	);
};

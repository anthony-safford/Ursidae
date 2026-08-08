import React, { Suspense } from 'react';
import { toolRegistry } from '../routes/toolRegistry';
import { NotFoundPage } from './NotFoundPage';

interface Props {
	/** The tool slug from the URL parameter. */
	name: string;
}

/** Loading fallback component shown while tool is loading. */
const LoadingFallback = (): React.ReactElement => {
	return (
		<div className="p-8">
			<p>Loading...</p>
		</div>
	);
};

/** Tool page component that lazy-loads and renders the requested tool. */
export const ToolPage = ({ name }: Props): React.ReactElement => {
	const entry = toolRegistry[name];

	if (!entry) {
		return <NotFoundPage />;
	}

	return (
		<Suspense fallback={<LoadingFallback />}>
			<entry.component />
		</Suspense>
	);
};

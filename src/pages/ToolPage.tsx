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
		<div style={{ padding: '2rem' }}>
			<p>Loading...</p>
		</div>
	);
};

/** Tool page component that lazy-loads and renders the requested tool. */
export const ToolPage = ({ name }: Props): React.ReactElement => {
	const ToolComponent = toolRegistry[name];

	if (!ToolComponent) {
		return <NotFoundPage />;
	}

	return (
		<Suspense fallback={<LoadingFallback />}>
			<ToolComponent />
		</Suspense>
	);
};

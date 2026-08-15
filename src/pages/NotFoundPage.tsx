import React from 'react';

/** 404 Not Found page. */
export const NotFoundPage = (): React.ReactElement => {
	return (
		<div className="p-lg">
			<h2 className="text-2xl font-bold">404 - Page Not Found</h2>
			<p className="text-text-muted">The page you're looking for doesn't exist.</p>
		</div>
	);
};

import React from 'react';

/** 404 Not Found page. */
export const NotFoundPage = (): React.ReactElement => {
	return (
		<div style={{ padding: '2rem' }}>
			<h2>404 - Page Not Found</h2>
			<p>The page you're looking for doesn't exist.</p>
		</div>
	);
};

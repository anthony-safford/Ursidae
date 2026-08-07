import React from 'react';

/** Layout wrapper component providing site-wide header and content structure. */
export const Layout = ({ children }: { children: React.ReactNode }): React.ReactElement => {
	return (
		<>
			<header style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
				<h1>Urisdae</h1>
			</header>
			<main>{children}</main>
		</>
	);
};

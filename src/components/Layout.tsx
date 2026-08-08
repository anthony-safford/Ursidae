import React from 'react';
import { Link } from 'wouter';
import { Nav } from './Nav';

/** Layout wrapper component providing site-wide header and content structure. */
export const Layout = ({ children }: { children: React.ReactNode }): React.ReactElement => {
	return (
		<>
			<header className="border-b border-gray-300 bg-white">
				<div className="px-4 py-4">
					<Link href="/" className="no-underline text-inherit">
						<h1 className="m-0 text-3xl font-bold text-gray-900">Urisdae</h1>
					</Link>
				</div>
				<Nav />
			</header>
			<main className="px-4 py-6">{children}</main>
		</>
	);
};

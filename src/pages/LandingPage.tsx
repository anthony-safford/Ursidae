import React from 'react';
import { Link } from 'wouter';
import { toolRegistry } from '../routes/toolRegistry';

/** Landing page listing all available tools. */
export const LandingPage = (): React.ReactElement => {
	return (
		<div style={{ padding: '2rem' }}>
			<h2>Available Tools</h2>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
					gap: '1rem',
				}}
			>
				{Object.keys(toolRegistry).map((slug) => (
					<Link
						key={slug}
						href={`/tools/${slug}`}
						style={{
							padding: '1rem',
							border: '1px solid #ddd',
							borderRadius: '4px',
							textDecoration: 'none',
							color: 'inherit',
							display: 'block',
							cursor: 'pointer',
							transition: 'background-color 0.2s',
						}}
						onMouseEnter={(e) => {
							(e.currentTarget as HTMLElement).style.backgroundColor = '#f5f5f5';
						}}
						onMouseLeave={(e) => {
							(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
						}}
					>
						<h3 style={{ margin: '0 0 0.5rem 0', textTransform: 'capitalize' }}>{slug}</h3>
						<p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Click to open</p>
					</Link>
				))}
			</div>
		</div>
	);
};

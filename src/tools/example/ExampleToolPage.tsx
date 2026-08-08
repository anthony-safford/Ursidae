import React, { useEffect, useState } from 'react';

/**
 * Example tool page demonstrating code-splitting, routing, and database integration.
 */
export const ExampleToolPage = (): React.ReactElement => {
	const [count, setCount] = useState<number | undefined>();

	useEffect(() => {
		const fetchCounter = async (): Promise<void> => {
			try {
				const response = await fetch('/api/example/counter');
				const data = (await response.json()) as { count: number };
				setCount(data.count);
			} catch (error) {
				console.error('Failed to fetch counter:', error);
			}
		};

		void fetchCounter();
	}, []);

	const handleIncrement = (): void => {
		const incrementCounter = async (): Promise<void> => {
			try {
				const response = await fetch('/api/example/counter/increment', { method: 'POST' });
				const data = (await response.json()) as { count: number };
				setCount(data.count);
			} catch (error) {
				console.error('Failed to increment counter:', error);
			}
		};

		void incrementCounter();
	};

	return (
		<div className="p-lg">
			<h2 className="text-2xl font-bold">Example Tool</h2>
			<p className="text-text-muted">
				This is an example tool demonstrating code-split routing and database integration.
			</p>

			<div className="mt-lg flex flex-col items-start gap-md">
				{count === undefined ? (
					<p className="text-text-muted">Loading...</p>
				) : (
					<div className="bg-surface border border-border rounded-brand p-md">
						<p className="text-xs uppercase tracking-wide text-text-muted">Count:</p>
						<p className="text-lg font-semibold text-accent">{count}</p>
					</div>
				)}
				<button
					onClick={handleIncrement}
					className="rounded-brand bg-accent px-md py-sm uppercase tracking-wide text-sm font-medium text-text hover:bg-accent-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={count === undefined}
				>
					Increment
				</button>
			</div>
		</div>
	);
};

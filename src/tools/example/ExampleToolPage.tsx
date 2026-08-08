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
		<div className="p-8">
			<h2 className="text-2xl font-bold">Example Tool</h2>
			<p>This is an example tool demonstrating code-split routing and database integration.</p>

			<div className="mt-6 flex flex-col items-start gap-4">
				{count === undefined ? (
					<p className="text-gray-600">Loading...</p>
				) : (
					<p className="text-lg font-semibold">
						Count: <span className="text-blue-600">{count}</span>
					</p>
				)}
				<button
					onClick={handleIncrement}
					className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={count === undefined}
				>
					Increment
				</button>
			</div>
		</div>
	);
};

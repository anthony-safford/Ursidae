import React from 'react';

interface Props {
	/** Child components to wrap. */
	children: React.ReactNode;
}

interface State {
	/** Whether an error has occurred. */
	hasError: boolean;
}

/** Error boundary component to catch and display errors in child components. */
export class ErrorBoundary extends React.Component<Props, State> {
	/** Initializes the error boundary. */
	public constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	/** Updates state when an error occurs. */
	public static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	/** Logs error details to console. */
	public componentDidCatch(error: Error): void {
		console.error('ErrorBoundary caught:', error);
	}

	/** Renders the component or error fallback. */
	public render(): React.ReactElement {
		if (this.state.hasError) {
			return (
				<div className="p-8 text-red-600">
					<h2>Something went wrong</h2>
					<p>An error occurred while rendering this component.</p>
				</div>
			);
		}

		return <>{this.props.children}</>;
	}
}

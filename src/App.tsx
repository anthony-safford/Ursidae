import React from 'react';
import { Switch, Route } from 'wouter';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ToolPage } from './pages/ToolPage';

/** Root application component with routing and layout. */
export const App = (): React.ReactElement => {
	return (
		<Layout>
			<ErrorBoundary>
				<Switch>
					<Route path="/" component={LandingPage} />
					<Route path="/tools/:name">{(params) => <ToolPage name={params.name} />}</Route>
					<Route component={NotFoundPage} />
				</Switch>
			</ErrorBoundary>
		</Layout>
	);
};

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExampleToolPage } from '../ExampleToolPage';

describe('ExampleToolPage', () => {
	it('renders the example tool heading and description', () => {
		render(<ExampleToolPage />);

		expect(screen.getByRole('heading', { name: 'Example Tool' })).toBeInTheDocument();
		expect(
			screen.getByText('This is an example tool demonstrating code-split routing.')
		).toBeInTheDocument();
	});
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tile } from '../Tile';

describe('Tile', () => {
	it('renders the title and content', () => {
		render(<Tile title="Assets">$482,300</Tile>);

		expect(screen.getByText('Assets')).toBeInTheDocument();
		expect(screen.getByText('$482,300')).toBeInTheDocument();
	});
});

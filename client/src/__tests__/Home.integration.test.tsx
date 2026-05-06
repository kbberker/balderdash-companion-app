import { vi, describe, it, expect } from 'vitest';

vi.mock('socket.io-client', () => ({
  io: () => ({
    connect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Home } from '../pages/Home';
import { GameProvider } from '../context/GameProvider';

describe('Home integration', () => {
  it('renders the home page with game controls', () => {
    render(
      <GameProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </GameProvider>,
    );
    expect(screen.getByText('Balderdash')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your Name')).toBeInTheDocument();
    expect(screen.getByText('Create New Game')).toBeInTheDocument();
    expect(screen.getByText('Join Game')).toBeInTheDocument();
  });
});

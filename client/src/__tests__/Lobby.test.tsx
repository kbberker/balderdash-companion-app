import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { ws } from 'msw';
import { toSocketIo } from '@mswjs/socket.io-binding';

import { server } from '../test/mocks/server';
import { GameContext, type GameState, type LobbyPlayer } from '../context/useGame';
import { Lobby } from '../pages/Lobby';

const link = ws.link('ws://localhost:4000/socket.io/');

type SetGameStateFn = (next: GameState | ((prev: GameState) => GameState)) => void;

function renderLobby(initialState: GameState, overrides?: { setGameState?: SetGameStateFn }) {
  const setGameState: SetGameStateFn = overrides?.setGameState ?? (() => {});
  return render(
    <GameContext.Provider
      value={{
        gameState: initialState,
        setGameState: setGameState as never,
      }}
    >
      <MemoryRouter initialEntries={[`/game/${initialState.gameCode ?? 'X'}`]}>
        <Routes>
          <Route path="/game/:gameCode" element={<Lobby />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    </GameContext.Provider>,
  );
}

const alice: LobbyPlayer = { id: 1, name: 'Alice', isCurrentDasher: true };
const bob: LobbyPlayer = { id: 2, name: 'Bob', isCurrentDasher: false };
const carol: LobbyPlayer = { id: 3, name: 'Carol', isCurrentDasher: false };

describe('Lobby', () => {
  it('shows the game code prominently', () => {
    renderLobby({ gameCode: 'ABCD', playerId: 1, players: [alice] });
    expect(screen.getByText('ABCD')).toBeInTheDocument();
  });

  it('renders every player name in the player list', () => {
    renderLobby({
      gameCode: 'ABCD',
      playerId: 1,
      players: [alice, bob, carol],
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });

  it('disables the Start Round button when there are fewer than 3 players', () => {
    renderLobby({ gameCode: 'ABCD', playerId: 1, players: [alice, bob] });
    expect(screen.getByRole('button', { name: /start round/i })).toBeDisabled();
  });

  it('enables the Start Round button at 3+ players', () => {
    renderLobby({
      gameCode: 'ABCD',
      playerId: 1,
      players: [alice, bob, carol],
    });
    expect(screen.getByRole('button', { name: /start round/i })).not.toBeDisabled();
  });

  it('redirects to home when there is no active game in context', () => {
    renderLobby({ gameCode: null, playerId: null, players: [] });
    expect(screen.queryByRole('button', { name: /start round/i })).toBeNull();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  // TODO(#13): re-enable once MSW's WebSocket interceptor can see the
  // socket.io-client connection under Vitest + jsdom.
  // https://github.com/kbberker/balderdash-companion-app/issues/13
  it.skip('appends a player to the list when a playerJoined event arrives', async () => {
    let resolveServer!: (io: ReturnType<typeof toSocketIo>['client']) => void;
    const serverReady = new Promise<ReturnType<typeof toSocketIo>['client']>((resolve) => {
      resolveServer = resolve;
    });

    server.use(
      link.addEventListener('connection', (connection) => {
        const io = toSocketIo(connection);
        resolveServer(io.client);
      }),
    );

    let currentState: GameState = {
      gameCode: 'ABCD',
      playerId: 1,
      players: [alice, bob],
    };
    const setGameState = (next: GameState | ((prev: GameState) => GameState)) => {
      currentState =
        typeof next === 'function' ? (next as (p: GameState) => GameState)(currentState) : next;
    };

    renderLobby(currentState, { setGameState });

    const ioClient = await serverReady;
    ioClient.emit('playerJoined', carol);

    await waitFor(() => {
      expect(currentState.players.map((p) => p.name)).toEqual(['Alice', 'Bob', 'Carol']);
    });
  });
});

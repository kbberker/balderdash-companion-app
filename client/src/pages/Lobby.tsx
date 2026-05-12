import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { socket } from '../lib/socket';
import { useGame, type LobbyPlayer } from '../context/useGame';

const MIN_PLAYERS_TO_START = 3;
const MAX_PLAYERS = 10;

export function Lobby() {
  const { gameState, setGameState } = useGame();

  useEffect(() => {
    if (!gameState.gameCode) return;

    const handlePlayerJoined = (player: LobbyPlayer) => {
      setGameState((prev) => {
        if (prev.players.some((p) => p.id === player.id)) return prev;
        return { ...prev, players: [...prev.players, player] };
      });
    };

    socket.on('playerJoined', handlePlayerJoined);
    return () => {
      socket.off('playerJoined', handlePlayerJoined);
    };
  }, [gameState.gameCode, setGameState]);

  if (!gameState.gameCode) {
    return <Navigate to="/" replace />;
  }

  const { players } = gameState;
  const canStart = players.length >= MIN_PLAYERS_TO_START;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center space-y-2">
          <p className="text-sm uppercase tracking-wide text-gray-500">Game Code</p>
          <p className="text-5xl font-mono font-bold tracking-widest">{gameState.gameCode}</p>
          <p className="text-xs text-gray-500">Share this code so friends can join.</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">
            Players ({players.length}/{MAX_PLAYERS})
          </h2>
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {players.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium">{p.name}</span>
                {p.isCurrentDasher && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Dasher
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <button
          type="button"
          disabled={!canStart}
          className="block w-full rounded-lg bg-blue-600 p-3 font-semibold text-white transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Start Round
        </button>
        {!canStart && (
          <p className="text-center text-sm text-gray-500">
            Need at least {MIN_PLAYERS_TO_START} players to start.
          </p>
        )}
      </div>
    </div>
  );
}

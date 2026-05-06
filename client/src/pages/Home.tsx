import { useState } from 'react';
import { useNavigate } from 'react-router';
import { io } from 'socket.io-client';
import { useGame, type LobbyPlayer } from '../context/useGame';

interface SocketResponse {
  success: boolean;
  error?: string;
  gameCode?: string;
  playerId?: number;
  players?: LobbyPlayer[];
}

const socket = io('http://localhost:4000');
socket.connect();

export function Home() {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setGameState } = useGame();

  const handleResponse = (response: SocketResponse, fallbackCode?: string) => {
    if (
      response.success &&
      response.gameCode &&
      response.playerId !== undefined &&
      response.players
    ) {
      setGameState({
        gameCode: response.gameCode,
        playerId: response.playerId,
        players: response.players,
      });
      navigate(`/game/${response.gameCode}`);
    } else {
      setErrorMessage(response.error ?? 'Something went wrong');
      void fallbackCode;
    }
  };

  const createGame = () => {
    setErrorMessage(null);
    socket.emit('createGame', { playerName }, (response: SocketResponse) => {
      handleResponse(response);
    });
  };

  const joinGame = () => {
    setErrorMessage(null);
    socket.emit('joinGame', { gameCode, playerName }, (response: SocketResponse) => {
      handleResponse(response, gameCode);
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Balderdash</h1>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="block w-full p-2 border rounded"
        />
        <div className="space-y-2">
          <button onClick={createGame} className="block w-full p-2 bg-blue-500 text-white rounded">
            Create New Game
          </button>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Game Code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              className="flex-1 p-2 border rounded"
            />
            <button onClick={joinGame} className="p-2 bg-green-500 text-white rounded">
              Join Game
            </button>
          </div>
        </div>
        {errorMessage && (
          <p role="alert" className="text-red-600 text-sm">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');
socket.connect();

export function Home() {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const navigate = useNavigate();

  const createGame = async () => {
    try {
      socket.emit('createGame', { playerName }, (response: any) => {
        if (response.success) {
          navigate(`/game/${response.gameCode}`);
        }
      });
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const joinGame = async () => {
    try {
      socket.emit('joinGame', { gameCode, playerName }, (response: any) => {
        if (response.success) {
          navigate(`/game/${gameCode}`);
        }
      });
    } catch (error) {
      console.error('Failed to join game:', error);
    }
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
          <button
            onClick={createGame}
            className="block w-full p-2 bg-blue-500 text-white rounded"
          >
            Create New Game
          </button>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Game Code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={joinGame}
              className="p-2 bg-green-500 text-white rounded"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
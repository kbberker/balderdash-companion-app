import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { createContext, useState, Dispatch, SetStateAction } from 'react';
import { Home } from './pages/Home';

interface GameState {
  gameId: string | null;
  players: string[];
  currentRound: string | null;
  isDasher: boolean;
}

interface GameContextType {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
}

export const GameContext = createContext<GameContextType | null>(null);

export function App() {
  const [gameState, setGameState] = useState<GameState>({
    gameId: null,
    players: [],
    currentRound: null,
    isDasher: false,
  });

  return (
    <GameContext.Provider value={{ gameState, setGameState }}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* <Route path="/game/:gameId" element={<Game />} /> */}
        </Routes>
      </Router>
    </GameContext.Provider>
  );
}

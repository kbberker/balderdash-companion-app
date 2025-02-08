import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { createContext, useState } from 'react';
import { Home } from './pages/Home';

export const GameContext = createContext<any>(null);

export function App() {
  const [gameState, setGameState] = useState({
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
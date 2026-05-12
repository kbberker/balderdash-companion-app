import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { GameProvider } from './context/GameProvider';

export function App() {
  return (
    <GameProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:gameCode" element={<Lobby />} />
        </Routes>
      </Router>
    </GameProvider>
  );
}

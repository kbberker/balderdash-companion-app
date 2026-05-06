import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { Home } from './pages/Home';
import { GameProvider } from './context/GameProvider';

export function App() {
  return (
    <GameProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </GameProvider>
  );
}

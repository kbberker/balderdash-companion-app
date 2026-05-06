import { useState, type ReactNode } from 'react';
import { GameContext, initialGameState, type GameState } from './useGame';

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  return (
    <GameContext.Provider value={{ gameState, setGameState }}>{children}</GameContext.Provider>
  );
}

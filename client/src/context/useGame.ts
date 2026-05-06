import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';

export interface LobbyPlayer {
  id: number;
  name: string;
  isCurrentDasher: boolean;
}

export interface GameState {
  gameCode: string | null;
  playerId: number | null;
  players: LobbyPlayer[];
}

export const initialGameState: GameState = {
  gameCode: null,
  playerId: null,
  players: [],
};

export interface GameContextValue {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return ctx;
}

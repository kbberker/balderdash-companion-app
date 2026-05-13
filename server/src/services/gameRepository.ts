export interface GameRecord {
  id: number;
  code: string;
  status: 'waiting' | 'active' | 'completed';
}

export interface PlayerRecord {
  id: number;
  gameId: number;
  name: string;
  isCurrentDasher: boolean;
  isConnected: boolean;
  score: number;
}

export interface GameRepository {
  createGameWithCreator(input: {
    code: string;
    creatorName: string;
  }): Promise<{ game: GameRecord; player: PlayerRecord }>;

  findGameByCode(code: string): Promise<GameRecord | null>;

  listPlayers(gameId: number): Promise<PlayerRecord[]>;

  addPlayer(input: { gameId: number; name: string }): Promise<PlayerRecord>;
}

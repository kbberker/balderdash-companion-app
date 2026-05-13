import type { GameRecord, GameRepository, PlayerRecord } from '../../gameRepository';

export class InMemoryGameRepository implements GameRepository {
  private games = new Map<number, GameRecord>();
  private players = new Map<number, PlayerRecord>();
  private nextGameId = 1;
  private nextPlayerId = 1;

  async createGameWithCreator(input: {
    code: string;
    creatorName: string;
  }): Promise<{ game: GameRecord; player: PlayerRecord }> {
    const game: GameRecord = {
      id: this.nextGameId++,
      code: input.code,
      status: 'waiting',
    };
    const player: PlayerRecord = {
      id: this.nextPlayerId++,
      gameId: game.id,
      name: input.creatorName,
      isCurrentDasher: true,
      isConnected: true,
      score: 0,
    };
    this.games.set(game.id, game);
    this.players.set(player.id, player);
    return { game, player };
  }

  async findGameByCode(code: string): Promise<GameRecord | null> {
    for (const game of this.games.values()) {
      if (game.code === code) return game;
    }
    return null;
  }

  async listPlayers(gameId: number): Promise<PlayerRecord[]> {
    return [...this.players.values()].filter((p) => p.gameId === gameId);
  }

  async addPlayer(input: { gameId: number; name: string }): Promise<PlayerRecord> {
    const player: PlayerRecord = {
      id: this.nextPlayerId++,
      gameId: input.gameId,
      name: input.name,
      isCurrentDasher: false,
      isConnected: true,
      score: 0,
    };
    this.players.set(player.id, player);
    return player;
  }
}

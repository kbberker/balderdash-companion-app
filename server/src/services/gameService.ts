import type { GameRecord, GameRepository, PlayerRecord } from './gameRepository';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 4;
const MAX_GENERATION_ATTEMPTS = 10;
export const MAX_PLAYERS_PER_GAME = 10;
export const MIN_PLAYERS_TO_START = 3;

export class GameNotFoundError extends Error {
  constructor(public readonly gameCode: string) {
    super(`Game not found: ${gameCode}`);
    this.name = 'GameNotFoundError';
  }
}

export class GameFullError extends Error {
  constructor(public readonly gameCode: string) {
    super(`Game ${gameCode} is full (max ${MAX_PLAYERS_PER_GAME} players)`);
    this.name = 'GameFullError';
  }
}

export class GameService {
  constructor(
    private readonly repo: GameRepository,
    private readonly generateCode: () => string = defaultCodeGenerator,
  ) {}

  async createGame(input: { playerName: string }): Promise<{
    gameCode: string;
    game: GameRecord;
    players: PlayerRecord[];
  }> {
    const playerName = input.playerName.trim();
    if (!playerName) {
      throw new Error('Player name is required');
    }

    const code = await this.generateUniqueCode();
    const { game, player } = await this.repo.createGameWithCreator({
      code,
      creatorName: playerName,
    });
    return { gameCode: code, game, players: [player] };
  }

  async joinGame(input: { gameCode: string; playerName: string }): Promise<{
    game: GameRecord;
    players: PlayerRecord[];
    player: PlayerRecord;
  }> {
    const playerName = input.playerName.trim();
    if (!playerName) {
      throw new Error('Player name is required');
    }

    const game = await this.repo.findGameByCode(input.gameCode);
    if (!game) {
      throw new GameNotFoundError(input.gameCode);
    }

    const existing = await this.repo.listPlayers(game.id);
    if (existing.length >= MAX_PLAYERS_PER_GAME) {
      throw new GameFullError(input.gameCode);
    }

    const player = await this.repo.addPlayer({
      gameId: game.id,
      name: playerName,
    });
    return { game, players: [...existing, player], player };
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      const code = this.generateCode();
      const existing = await this.repo.findGameByCode(code);
      if (!existing) return code;
    }
    throw new Error('Failed to generate a unique game code');
  }
}

function defaultCodeGenerator(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

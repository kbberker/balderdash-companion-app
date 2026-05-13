import { describe, it, expect, beforeEach } from 'vitest';
import {
  GameService,
  GameNotFoundError,
  GameFullError,
  MAX_PLAYERS_PER_GAME,
} from '../gameService';
import { InMemoryGameRepository } from './fakes/inMemoryGameRepository';

describe('GameService.createGame', () => {
  let repo: InMemoryGameRepository;
  let service: GameService;

  beforeEach(() => {
    repo = new InMemoryGameRepository();
    service = new GameService(repo);
  });

  it('persists a new game in waiting status with the creator as the first player', async () => {
    const result = await service.createGame({ playerName: 'Alice' });

    expect(result.gameCode).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.players).toHaveLength(1);
    expect(result.players[0]?.name).toBe('Alice');

    const persisted = await repo.findGameByCode(result.gameCode);
    expect(persisted).not.toBeNull();
    expect(persisted?.status).toBe('waiting');
  });

  it('marks the creator as the current dasher', async () => {
    const result = await service.createGame({ playerName: 'Alice' });
    expect(result.players[0]?.isCurrentDasher).toBe(true);
  });

  it('generates unique codes across multiple creations', async () => {
    const a = await service.createGame({ playerName: 'Alice' });
    const b = await service.createGame({ playerName: 'Bob' });
    expect(a.gameCode).not.toBe(b.gameCode);
  });

  it('rejects empty player names', async () => {
    await expect(service.createGame({ playerName: '' })).rejects.toThrow();
    await expect(service.createGame({ playerName: '   ' })).rejects.toThrow();
  });
});

describe('GameService.joinGame', () => {
  let repo: InMemoryGameRepository;
  let service: GameService;

  beforeEach(() => {
    repo = new InMemoryGameRepository();
    service = new GameService(repo);
  });

  it('appends a new player to the players list of an existing game', async () => {
    const created = await service.createGame({ playerName: 'Alice' });

    const result = await service.joinGame({
      gameCode: created.gameCode,
      playerName: 'Bob',
    });

    expect(result.players).toHaveLength(2);
    expect(result.players.map((p) => p.name)).toEqual(['Alice', 'Bob']);
    expect(result.players[1]?.isCurrentDasher).toBe(false);
  });

  it('throws GameNotFoundError for an unknown code', async () => {
    await expect(service.joinGame({ gameCode: 'ZZZZ', playerName: 'Bob' })).rejects.toBeInstanceOf(
      GameNotFoundError,
    );
  });

  it('throws GameFullError when the game already has the max number of players', async () => {
    const created = await service.createGame({ playerName: 'Alice' });
    for (let i = 1; i < MAX_PLAYERS_PER_GAME; i++) {
      await service.joinGame({
        gameCode: created.gameCode,
        playerName: `Player${i}`,
      });
    }

    await expect(
      service.joinGame({
        gameCode: created.gameCode,
        playerName: 'OneTooMany',
      }),
    ).rejects.toBeInstanceOf(GameFullError);
  });

  it('rejects empty player names', async () => {
    const created = await service.createGame({ playerName: 'Alice' });
    await expect(
      service.joinGame({ gameCode: created.gameCode, playerName: '' }),
    ).rejects.toThrow();
  });
});

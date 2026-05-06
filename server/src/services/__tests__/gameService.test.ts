import { describe, it, expect, beforeEach } from 'vitest';
import { GameService } from '../gameService';
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

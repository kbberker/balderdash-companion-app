import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import type { GameRecord, GameRepository, PlayerRecord } from './gameRepository';

type Db = NodePgDatabase<typeof schema>;

export class PgGameRepository implements GameRepository {
  constructor(private readonly db: Db) {}

  async createGameWithCreator(input: {
    code: string;
    creatorName: string;
  }): Promise<{ game: GameRecord; player: PlayerRecord }> {
    return this.db.transaction(async (tx) => {
      const [game] = await tx
        .insert(schema.games)
        .values({ code: input.code, status: 'waiting' })
        .returning();
      if (!game) throw new Error('Failed to insert game');

      const [player] = await tx
        .insert(schema.players)
        .values({
          gameId: game.id,
          name: input.creatorName,
          isCurrentDasher: true,
        })
        .returning();
      if (!player) throw new Error('Failed to insert player');

      return { game: toGameRecord(game), player: toPlayerRecord(player) };
    });
  }

  async findGameByCode(code: string): Promise<GameRecord | null> {
    const [game] = await this.db
      .select()
      .from(schema.games)
      .where(eq(schema.games.code, code))
      .limit(1);
    return game ? toGameRecord(game) : null;
  }

  async listPlayers(gameId: number): Promise<PlayerRecord[]> {
    const rows = await this.db
      .select()
      .from(schema.players)
      .where(eq(schema.players.gameId, gameId));
    return rows.map(toPlayerRecord);
  }

  async addPlayer(input: { gameId: number; name: string }): Promise<PlayerRecord> {
    const [player] = await this.db
      .insert(schema.players)
      .values({
        gameId: input.gameId,
        name: input.name,
        isCurrentDasher: false,
      })
      .returning();
    if (!player) throw new Error('Failed to insert player');
    return toPlayerRecord(player);
  }
}

type GameRow = typeof schema.games.$inferSelect;
type PlayerRow = typeof schema.players.$inferSelect;

function toGameRecord(row: GameRow): GameRecord {
  return {
    id: row.id,
    code: row.code,
    status: row.status as GameRecord['status'],
  };
}

function toPlayerRecord(row: PlayerRow): PlayerRecord {
  return {
    id: row.id,
    gameId: row.gameId,
    name: row.name,
    isCurrentDasher: row.isCurrentDasher ?? false,
    isConnected: row.isConnected ?? true,
    score: row.score ?? 0,
  };
}

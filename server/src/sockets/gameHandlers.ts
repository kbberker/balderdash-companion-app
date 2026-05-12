import type { Server, Socket } from 'socket.io';
import { GameFullError, GameNotFoundError, GameService } from '../services/gameService';
import type { PlayerRecord } from '../services/gameRepository';

interface CreateGamePayload {
  playerName: string;
}

interface JoinGamePayload {
  gameCode: string;
  playerName: string;
}

interface SuccessResponse {
  success: true;
  gameCode: string;
  playerId: number;
  players: PublicPlayer[];
}

interface ErrorResponse {
  success: false;
  error: string;
}

type GameResponse = SuccessResponse | ErrorResponse;

interface PublicPlayer {
  id: number;
  name: string;
  isCurrentDasher: boolean;
}

type Ack<T> = (response: T) => void;

export function registerGameHandlers(io: Server, socket: Socket, service: GameService): void {
  socket.on('createGame', async (payload: CreateGamePayload, ack?: Ack<GameResponse>) => {
    try {
      const { gameCode, players } = await service.createGame({
        playerName: payload.playerName,
      });
      socket.join(gameCode);
      ack?.({
        success: true,
        gameCode,
        playerId: players[0]!.id,
        players: players.map(toPublicPlayer),
      });
    } catch (err) {
      logUnexpected(err);
      ack?.({ success: false, error: errorMessage(err) });
    }
  });

  socket.on('joinGame', async (payload: JoinGamePayload, ack?: Ack<GameResponse>) => {
    try {
      const { player, players } = await service.joinGame({
        gameCode: payload.gameCode,
        playerName: payload.playerName,
      });
      socket.join(payload.gameCode);
      const publicPlayer = toPublicPlayer(player);
      io.to(payload.gameCode).emit('playerJoined', publicPlayer);
      ack?.({
        success: true,
        gameCode: payload.gameCode,
        playerId: player.id,
        players: players.map(toPublicPlayer),
      });
    } catch (err) {
      logUnexpected(err);
      ack?.({ success: false, error: errorMessage(err) });
    }
  });
}

function toPublicPlayer(p: PlayerRecord): PublicPlayer {
  return { id: p.id, name: p.name, isCurrentDasher: p.isCurrentDasher };
}

function logUnexpected(err: unknown): void {
  if (err instanceof GameNotFoundError) return;
  if (err instanceof GameFullError) return;
  console.error(err);
}

function errorMessage(err: unknown): string {
  if (err instanceof GameNotFoundError) return 'Game not found';
  if (err instanceof GameFullError) return 'Game is full';
  if (err instanceof AggregateError) {
    const inner = err.errors.map(errorMessage).filter(Boolean).join('; ');
    return inner || err.message || 'Unexpected error';
  }
  if (err instanceof Error) return err.message;
  return 'Unexpected error';
}

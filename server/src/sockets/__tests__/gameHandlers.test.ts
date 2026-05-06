import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createServer, type Server as HttpServer } from 'http';
import { Server, type Socket as ServerSocket } from 'socket.io';
import { io as createClient, type Socket as ClientSocket } from 'socket.io-client';
import type { AddressInfo } from 'net';

import { GameService, MAX_PLAYERS_PER_GAME } from '../../services/gameService';
import { InMemoryGameRepository } from '../../services/__tests__/fakes/inMemoryGameRepository';
import { registerGameHandlers } from '../gameHandlers';

interface CreateGameResponse {
  success: boolean;
  error?: string;
  gameCode?: string;
  playerId?: number;
  players?: { id: number; name: string; isCurrentDasher: boolean }[];
}

type JoinGameResponse = CreateGameResponse;

describe('socket handlers: createGame / joinGame', () => {
  let httpServer: HttpServer;
  let io: Server;
  let port: number;
  let service: GameService;

  beforeEach(async () => {
    httpServer = createServer();
    io = new Server(httpServer);
    service = new GameService(new InMemoryGameRepository());
    io.on('connection', (socket: ServerSocket) => {
      registerGameHandlers(io, socket, service);
    });
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => resolve());
    });
    port = (httpServer.address() as AddressInfo).port;
  });

  afterEach(async () => {
    io.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  function connectClient(): Promise<ClientSocket> {
    const client = createClient(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
    });
    return new Promise((resolve, reject) => {
      client.on('connect', () => resolve(client));
      client.on('connect_error', reject);
    });
  }

  function emitWithAck<T>(client: ClientSocket, event: string, payload: unknown): Promise<T> {
    return new Promise((resolve) => {
      client.emit(event, payload, (response: T) => resolve(response));
    });
  }

  it('createGame returns a game code and the creator player', async () => {
    const client = await connectClient();
    const response = await emitWithAck<CreateGameResponse>(client, 'createGame', {
      playerName: 'Alice',
    });
    client.disconnect();

    expect(response.success).toBe(true);
    expect(response.gameCode).toMatch(/^[A-Z0-9]{4}$/);
    expect(response.players).toHaveLength(1);
    expect(response.players?.[0]?.name).toBe('Alice');
    expect(response.playerId).toBe(response.players?.[0]?.id);
  });

  it('createGame rejects empty player names with success=false', async () => {
    const client = await connectClient();
    const response = await emitWithAck<CreateGameResponse>(client, 'createGame', {
      playerName: '',
    });
    client.disconnect();

    expect(response.success).toBe(false);
    expect(response.error).toBeTruthy();
  });

  it('joinGame adds a second player and broadcasts playerJoined to the room', async () => {
    const host = await connectClient();
    const created = await emitWithAck<CreateGameResponse>(host, 'createGame', {
      playerName: 'Alice',
    });
    expect(created.success).toBe(true);

    const playerJoined = new Promise<{ id: number; name: string }>((resolve) => {
      host.on('playerJoined', resolve);
    });

    const guest = await connectClient();
    const join = await emitWithAck<JoinGameResponse>(guest, 'joinGame', {
      gameCode: created.gameCode,
      playerName: 'Bob',
    });

    expect(join.success).toBe(true);
    expect(join.players).toHaveLength(2);

    const announced = await playerJoined;
    expect(announced.name).toBe('Bob');

    host.disconnect();
    guest.disconnect();
  });

  it('joinGame returns success=false with error for unknown game code', async () => {
    const client = await connectClient();
    const response = await emitWithAck<JoinGameResponse>(client, 'joinGame', {
      gameCode: 'ZZZZ',
      playerName: 'Bob',
    });
    client.disconnect();

    expect(response.success).toBe(false);
    expect(response.error).toMatch(/not found/i);
  });

  it('joinGame returns success=false with "full" error once the game is full', async () => {
    const host = await connectClient();
    const created = await emitWithAck<CreateGameResponse>(host, 'createGame', {
      playerName: 'Alice',
    });

    for (let i = 1; i < MAX_PLAYERS_PER_GAME; i++) {
      const filler = await connectClient();
      const r = await emitWithAck<JoinGameResponse>(filler, 'joinGame', {
        gameCode: created.gameCode,
        playerName: `Player${i}`,
      });
      expect(r.success).toBe(true);
      filler.disconnect();
    }

    const overflow = await connectClient();
    const response = await emitWithAck<JoinGameResponse>(overflow, 'joinGame', {
      gameCode: created.gameCode,
      playerName: 'OneTooMany',
    });
    overflow.disconnect();
    host.disconnect();

    expect(response.success).toBe(false);
    expect(response.error).toMatch(/full/i);
  });
});

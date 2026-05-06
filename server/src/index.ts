import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import cors from 'cors';
import * as schema from './db/schema';
import { GameService } from './services/gameService';
import { PgGameRepository } from './services/pgGameRepository';
import { registerGameHandlers } from './sockets/gameHandlers';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });
const gameService = new GameService(new PgGameRepository(db));

io.on('connection', (socket) => {
  console.info('Client connected:', socket.id);

  registerGameHandlers(io, socket, gameService);

  socket.on('submitAnswer', async ({ gameCode, playerId, answer: _answer }) => {
    try {
      io.to(gameCode).emit('answerSubmitted', { playerId });
    } catch {
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  });

  socket.on('submitVote', async ({ gameCode, playerId, answerId: _answerId }) => {
    try {
      io.to(gameCode).emit('voteSubmitted', { playerId });
    } catch {
      socket.emit('error', { message: 'Failed to submit vote' });
    }
  });

  socket.on('disconnect', () => {
    console.info('Client disconnected:', socket.id);
  });
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
});

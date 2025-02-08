import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import cors from 'cors';
import * as schema from './db/schema';

// Initialize Express app and HTTP server
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool, { schema });

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join game room
  socket.on('joinGame', async ({ gameCode, playerName }) => {
    try {
      // Add player to game logic here
      socket.join(gameCode);
      io.to(gameCode).emit('playerJoined', { playerName });
    } catch (error) {
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Submit answer
  socket.on('submitAnswer', async ({ gameCode, playerId, answer }) => {
    try {
      // Save answer logic here
      io.to(gameCode).emit('answerSubmitted', { playerId });
    } catch (error) {
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  });

  // Submit vote
  socket.on('submitVote', async ({ gameCode, playerId, answerId }) => {
    try {
      // Save vote logic here
      io.to(gameCode).emit('voteSubmitted', { playerId });
    } catch (error) {
      socket.emit('error', { message: 'Failed to submit vote' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API Routes
app.use(cors());
app.use(express.json());

// Start server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// Games table to store active and completed game sessions
export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // Join code for players
  status: text('status').notNull(), // 'waiting', 'active', 'completed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  currentRound: integer('current_round').default(0),
  isComplete: boolean('is_complete').default(false)
});

// Players table to store all players in a game
export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id),
  name: text('name').notNull(),
  isConnected: boolean('is_connected').default(true),
  score: integer('score').default(0),
  isCurrentDasher: boolean('is_current_dasher').default(false)
});

// Rounds table to store each round's details
export const rounds = pgTable('rounds', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id),
  dasherId: integer('dasher_id').notNull().references(() => players.id),
  prompt: text('prompt').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  roundNumber: integer('round_number').notNull(),
  status: text('status').notNull(), // 'answering', 'voting', 'completed'
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Answers table to store player submissions
export const answers = pgTable('answers', {
  id: serial('id').primaryKey(),
  roundId: integer('round_id').notNull().references(() => rounds.id),
  playerId: integer('player_id').notNull().references(() => players.id),
  answer: text('answer').notNull(),
  isCorrectAnswer: boolean('is_correct_answer').default(false),
  resemblesCorrectAnswer: boolean('resembles_correct_answer').default(false)
});

// Votes table to store player votes
export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  roundId: integer('round_id').notNull().references(() => rounds.id),
  playerId: integer('player_id').notNull().references(() => players.id),
  answerId: integer('answer_id').notNull().references(() => answers.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
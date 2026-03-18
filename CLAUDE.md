# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run both client and server in dev mode
pnpm dev

# Run individually
pnpm --filter client dev      # Vite dev server at http://localhost:5173
pnpm --filter server dev      # ts-node-dev server at http://localhost:4000

# Build
pnpm build

# Type checking
pnpm check-types

# Lint
pnpm --filter client lint
pnpm --filter server lint
```

There are no test commands configured yet.

## Architecture

This is a **pnpm + Turborepo monorepo** with two packages: `client/` (React frontend) and `server/` (Express backend).

### Stack
- **Client**: React 18, TypeScript, Vite, React Router 7, socket.io-client, Tailwind CSS
- **Server**: Express, TypeScript, Socket.io, Drizzle ORM, PostgreSQL
- **Database**: Requires a PostgreSQL instance; set `DATABASE_URL` in `server/.env`

### Communication Pattern
The client and server communicate exclusively via Socket.io (not REST). The client connects to `http://localhost:4000`. All game state updates flow through socket events broadcast to socket.io rooms keyed by `gameCode`.

**Current socket events:**
| Direction | Event | Payload |
|-----------|-------|---------|
| C → S | `joinGame` | `{ gameCode, playerName }` |
| C → S | `submitAnswer` | `{ gameCode, playerId, answer }` |
| C → S | `submitVote` | `{ gameCode, playerId, answerId }` |
| S → C | `playerJoined` | player data |
| S → C | `answerSubmitted` | answer data |
| S → C | `voteSubmitted` | vote data |

### Game Domain
Balderdash is a bluffing party game:
1. The **Dasher** reads a prompt and knows the correct answer
2. Other players submit fake answers to fool other players
3. All players vote on which answer they think is correct
4. Points are awarded for guessing correctly and for fooling others

**Database tables:** `games`, `players`, `rounds`, `answers`, `votes` — defined in `server/src/db/schema.ts` using Drizzle ORM.

**Game phases:** `answering` → `voting` → `completed` (tracked on the `rounds` table).

### Frontend State
Global game state (current game, player info) is managed via React Context (`GameContext`) defined in `client/src/App.tsx` and provided to the entire app. Page routing is handled by React Router.

### Server Entry Point
`server/src/index.ts` initializes Express, creates the HTTP server, attaches Socket.io, and registers all socket event handlers. Database operations use Drizzle ORM with the `pg` driver.

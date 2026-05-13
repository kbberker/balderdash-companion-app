# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start / stop the Postgres dev container (required before `pnpm dev`).
# `db:up` uses --wait so it returns only once the container is healthy.
pnpm db:up
pnpm db:down

# Run both client and server in dev mode (assumes the DB is up)
pnpm dev

# Run individually
pnpm --filter client dev      # Vite dev server at http://localhost:5173
pnpm --filter server dev      # ts-node-dev server at http://localhost:4000

# Build
pnpm build

# Type checking
pnpm check-types

# Lint
pnpm lint                       # Both packages via Turbo
pnpm lint-client                # Client only via Turbo --filter
pnpm lint-server                # Server only via Turbo --filter

# Test
pnpm test                       # Both packages via Turbo
pnpm test-client                # Client only via Turbo --filter
pnpm test-server                # Server only via Turbo --filter

# Format
pnpm format                     # Fix all files
pnpm format:check               # Check only (used in CI)

# Database (from server/)
pnpm --filter server db:generate  # Generate migration from schema changes
pnpm --filter server db:migrate   # Run pending migrations
pnpm --filter server db:studio    # Open Drizzle Studio
```

## Architecture

This is a **pnpm + Turborepo monorepo** with two packages: `client/` (React frontend) and `server/` (Express backend).

### Stack

- **Client**: React 18, TypeScript, Vite, React Router 7, socket.io-client, Tailwind CSS
- **Server**: Express, TypeScript, Socket.io, Drizzle ORM, PostgreSQL
- **Database**: PostgreSQL 18, run locally via `docker-compose.yml` at the repo root. `pnpm db:up` starts it. `server/.env` carries `DATABASE_URL` plus `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` (the last three are read by the Postgres container at startup via the `env_file:` directive).

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

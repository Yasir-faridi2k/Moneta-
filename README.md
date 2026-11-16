# MONETA

Personal Finance, Simplified.

MONETA is a small personal finance application built with React, TypeScript, Express, Prisma, and SQLite.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

## Getting started

```sh
npm install
npm run dev
```

The Vite frontend runs at http://localhost:5173 and the API at http://localhost:3001.
The API's local SQLite database defaults to `apps/api/prisma/dev.db`.

## Database

Prisma CLI and Client are configured for SQLite. From the repository root, run:

```sh
npm run db:generate -w @moneta/api
npm run db:migrate -w @moneta/api -- --name init
npm run db:seed -w @moneta/api
npm run db:verify -w @moneta/api
```

`db:verify` inserts a temporary transaction through Prisma Client, reads it back with its category, then deletes it. To change the SQLite connection, edit `apps/api/.env`; `.env.example` shows the default URL.

## API

- `/api/transactions` — list/filter, read, create, edit, and delete transactions
- `/api/budgets` — list, read, create, edit, and delete monthly category budgets with spending progress
- `/api/categories` — list, read, create, edit, and delete categories
- `/api/dashboard/summary` — database-backed totals, recent transactions, category spending, and six-month totals
- `/api/health` — service health check

Run `npm run api:verify -w @moneta/api` while the API is running to exercise these workflows against the local database. The script cleans up its temporary records.

## Workspace

- `apps/web` — React and Vite client
- `apps/api` — Express API and Prisma/SQLite database
- `docs` — project documentation

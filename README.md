# SyncNova

A simple local project management tool: clients/companies, projects under each client, tasks on a kanban-style board, and basic multi-user login (1-2 people).

## Structure

- `backend/` — Express + TypeScript API, using Prisma to talk to PostgreSQL.
  - `src/config/` — env loading (`env.ts`, all settings come from here), Prisma client.
  - `src/middleware/` — auth (JWT) check, error handling.
  - `src/modules/<name>/` — one folder per feature (auth, users, clients, projects, tasks), each split into `routes` → `controller` → `service` → `repository`. This keeps each layer simple and easy to change without touching the others.
- `frontend/` — React + TypeScript app (Vite), plain CSS, React Router.
  - `src/api/` — functions that call the backend.
  - `src/context/AuthContext.tsx` — holds the logged-in user and the JWT token.
  - `src/context/ThemeContext.tsx` — holds light/dark mode choice (saved in the browser).
  - `src/pages/` — one file per screen (login, register, clients list, client detail, project board).
  - `src/components/` — reusable pieces (task card, task edit popup, page layout).

## Data model

- **User** — has an email/password (login) and a name.
- **Client** — a company/customer you do work for. Has a name and optional contact/billing info.
- **Project** — belongs to one client, has an owner and a list of members, and an optional URL (e.g. the live site). Only the owner can add/remove members or delete the project. You see a client if you created it, or if you're a member of at least one project under it.
- **Task** — belongs to a project, has a status (`TODO` / `IN_PROGRESS` / `DONE`), an optional assignee, and an optional due date.

This is kept small on purpose. Things like sprints, time tracking, or reports are not built yet, but the data model does not block adding them later.

## Running it locally

You need Node.js and a local PostgreSQL server running.

### 1. Backend

```
cd backend
npm install         # first time only
npm run dev
```

The `.env` file already points to `postgresql://postgres:password@localhost:5432/syncnova`. Change it if your local Postgres uses a different user/password. See `.env.example` for what every setting does.

The database and tables are already created (via `npx prisma migrate dev`). If you ever change `prisma/schema.prisma`, run `npm run prisma:migrate` again to apply the change.

The API runs on `http://localhost:4000`.

### 2. Frontend

In a separate terminal:

```
cd frontend
npm install         # first time only
npm run dev
```

Open `http://localhost:5173` in your browser. The dev server forwards any `/api/...` request straight to the backend (see `vite.config.ts`), so the browser only ever talks to one address and there's no CORS setup to worry about.

### 3. First use

Go to `/register` to create your first account, then create a client, then a project under it. To add a second person to a project, register a second account (different email), then, as the project owner, add them as a member from the project page.

### Light / dark mode

There's a toggle button in the top bar. It follows your system preference the first time, then remembers your choice in the browser.

## Deploying (going live)

Nothing is hardcoded to `localhost` — every environment-specific value lives in a `.env` file, so moving to a real server is just a matter of editing `.env` and not touching any code. Copy `.env.example` to `.env` in each folder as a starting point.

**Backend (`backend/.env`):**

| Variable | What to set it to |
|---|---|
| `DATABASE_URL` | Your production Postgres connection string |
| `JWT_SECRET` | A long random value (e.g. `openssl rand -hex 32`) — never reuse the dev one |
| `PORT` | Whatever port your host expects (many hosts set this for you) |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | The frontend's public URL, if it's hosted separately (see below). Leave as `*` if not. |
| `FRONTEND_DIST_PATH` | Usually leave as-is; see the single-server option below |

**Two ways to deploy the frontend:**

1. **Single server (simplest)** — build the frontend, then just run the backend:
   ```
   cd frontend && npm run build
   cd ../backend && npm run build && npm start
   ```
   With `NODE_ENV=production`, the backend automatically serves the built frontend (`frontend/dist`) itself, so the whole app runs as one process on one port. No `CORS_ORIGIN` setup needed since it's all the same origin. This is the easiest option for a small team.

2. **Frontend hosted separately** (e.g. a static host, while the backend runs elsewhere) — in `frontend/.env`, set `VITE_API_URL` to the backend's public URL (e.g. `https://api.example.com/api`), then run `npm run build` and deploy the `dist` folder. On the backend, set `CORS_ORIGIN` to the frontend's URL so the browser is allowed to call it.

## Useful commands

- `cd backend && npm run prisma:studio` — opens a browser UI to look at the database directly.
- `cd backend && npx tsc --noEmit` — type-check the backend without running it.
- `cd frontend && npm run build` — build the frontend for production.

# PROPERTYGRAPH

Commercial real estate ownership intelligence across the active PropertyGraph index.

Dark, sharp, high-signal. Graph-based CRE ownership analysis with multi-layer entity resolution, value-movement freshness, and signal detection.

## Stack

- **Next.js 14** (App Router)
- **TailwindCSS** (dark mode, brutalist UI)
- **React Flow** (`@xyflow/react`) for graph visualization
- **Supabase** (Postgres)

## Project Structure

```
propertygraph/
├── apps/web/              ← Next.js app
│   └── src/
│       ├── app/           ← Pages + API routes
│       ├── components/    ← React Flow nodes, graph canvas
│       └── lib/           ← Supabase client
├── packages/db/           ← Supabase client + TypeScript types
└── scripts/ingest/        ← Source-ingest utilities and legacy seed helpers
```

## Setup

### 1. Create Supabase Project

Go to [supabase.com](https://supabase.com), create a new project, and grab your **Project URL** and **anon key** from Settings → API.

### 2. Configure Environment

Edit `apps/web/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=server-side-service-role-key
CRON_SECRET=random-long-secret-for-vercel-cron
PROPERTYGRAPH_REFRESH_WORKER_URL=https://your-ingest-worker.example.com/refresh
PROPERTYGRAPH_REFRESH_WORKER_TOKEN=optional-worker-bearer-token
```

### 3. Database

Production reads from Supabase `properties_clean` and related graph tables. Local seed helpers still exist for isolated development, but the app should not present seeded or generated rows as source-backed records.

Optional local seed file:

```bash
npx tsx scripts/ingest/seed.ts > seed.sql
```

Then paste the contents of `seed.sql` into the **Supabase SQL Editor** and run it.

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Operator Flow

1. Open the executive overview and confirm the active indexed property count.
2. Use Market Intelligence to filter county records and inspect value movement.
3. Open a property to review owner, current value, source vintage, prior value when present, and COSMIC signal state.
4. Open ownership graph views to trace entity relationships.
5. Treat unavailable prior values as a refusal, not a fabricated trend.

## Weekly Refresh

Vercel Cron calls `GET /api/cron/weekly-refresh` every Monday at 11:00 UTC. The route requires `CRON_SECRET` and triggers a real refresh worker through `PROPERTYGRAPH_REFRESH_WORKER_URL`.

If the worker URL is missing, the endpoint returns a structured refusal and logs the attempted run. This is intentional: PropertyGraph must not pretend a refresh happened unless a source-backed ingest worker accepted the job.

## Routes

| Route | Description |
|---|---|
| `/` | Search bar + active signals panel |
| `/property/[id]` | Property details + ownership |
| `/entity/[id]` | Entity portfolio + signals |
| `/graph/[entityId]` | Full-screen network graph (React Flow) |

## API Routes

| Endpoint | Description |
|---|---|
| `GET /api/search?q=` | Search properties + entities by name |
| `GET /api/graph/[entityId]` | Get nodes + edges for React Flow graph |
| `GET /api/signals` | Get all active signals with entity names |
| `GET /api/stats` | Active index count and county-level counts |
| `GET /api/cron/weekly-refresh` | Weekly source-refresh trigger, guarded by `CRON_SECRET` |

## Legacy Seed Fixture

The repo still includes a tiny seed fixture for local schema checks. It is not the product corpus and should never be described as the active PropertyGraph index.

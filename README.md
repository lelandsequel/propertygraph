# PROPERTYGRAPH

Commercial real estate ownership intelligence — Harris County TX.

Dark, sharp, high-signal. Graph-based CRE ownership analysis with multi-layer entity resolution and signal detection.

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
└── scripts/ingest/        ← Seed data generator
```

## Setup

### 1. Create Supabase Project

Go to [supabase.com](https://supabase.com), create a new project, and grab your **Project URL** and **anon key** from Settings → API.

### 2. Configure Environment

Edit `apps/web/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Seed the Database

Generate the SQL seed file:

```bash
npx tsx scripts/ingest/seed.ts > seed.sql
```

Then paste the contents of `seed.sql` into the **Supabase SQL Editor** and run it. This creates all tables and inserts 15 properties, 8 entities, ownership links, entity relationships, and 3 signals.

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Flow

1. Search **"1400 Post Oak"** → dropdown shows the property
2. Click → property page shows owner: **PostOak Capital Holdings LLC**
3. Click **"View Ownership Graph →"** → graph loads
4. Graph shows: LLC → 6 properties + parent holding company → individual (Marcus J. Thornton)
5. Signal badge glows: **⚡ ACQUISITION PATTERN** and **⚡ CLUSTERED OWNERSHIP**
6. Navigate to Marcus J. Thornton → see the full roll-up pattern across 7 entities

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

## Seed Data

- **15 properties** — commercial, Houston TX area (Post Oak Blvd, Westheimer, Downtown)
- **8 entities** — LLCs, trusts, corporations, 1 individual
- **Multi-layer ownership chains** — LLC → holding company → trust → individual
- **3 signals:**
  1. Multi-property acquisition pattern (92% confidence)
  2. Clustered ownership in ZIP 77056 (78% confidence)
  3. Shared manager across 7 entities — roll-up candidate (89% confidence)

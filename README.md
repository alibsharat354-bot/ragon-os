# Ragon OS — Business Operating System

Production-ready private business dashboard for Ragon Solutions.
Stack: Next.js 16, TypeScript, Tailwind CSS v4, Supabase, Recharts, Vercel.

## Quick Start

```bash
npm install
cp .env.example .env.local  # fill in your Supabase keys
npm run dev
```

## Supabase Setup

1. Create project at https://supabase.com
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy Project URL + anon key to `.env.local`
4. Sign up at /login to create your account

## Deploy to Vercel

1. Push to GitHub
2. Import repo at vercel.com
3. Add environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Deploy

## Pages

- /command-center — Live dashboard
- /clients — Client database
- /projects — Project management
- /tasks — Task system
- /leads — Lead database + Kanban
- /outreach — Outreach log + campaigns
- /pipeline — Sales pipeline Kanban
- /money — Income/expense tracking
- /invoices — Invoice management
- /ugc — UGC/shoots production tracking
- /fiverr — Fiverr + Upwork tracking
- /analytics — Revenue charts + funnel
- /activity — Activity log
- /settings — Profile + targets

## Build

```bash
npm run build   # Must pass before deploying
npm run start
```

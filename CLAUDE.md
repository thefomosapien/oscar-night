# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm start        # Start production server
```

No test framework is configured.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The Supabase schema is in `supabase-schema.sql` — a single `game_state` table with JSONB columns for `players` and `results`, with realtime enabled.

## Architecture

Oscar Night is a real-time multiplayer Oscar prediction game for exactly 3 players, built with Next.js + Supabase Realtime.

**Core data model** (`lib/types.ts`):
- `GameState`: Single Supabase row (id = `'main'`) holding all state — `players[]` and `results` map
- `Player`: name (max 16 chars), `predictions` map (category ID → nominee), `lockedIn` boolean
- Entire game state is one document; all mutations do a full upsert to Supabase

**Screen flow** in `app/page.tsx` (single large component, ~865 lines):
1. `join` — lobby until 3 players have joined
2. `predict` — current player fills in 24 categories
3. `waiting` — holding screen while others finish
4. `live` — real-time scoreboard; admin marks winners as ceremony progresses

State transitions are driven by Supabase Realtime (`postgres_changes` subscription) — all clients update simultaneously when the DB changes.

**Session persistence**: Player nickname stored in `localStorage` under key `oscar26-me`; returning players auto-restore their slot.

**Scoring** (`lib/categories.ts`): 24 categories across 3 tiers — Tier 1 (1pt, marquee awards), Tier 2 (2pts), Tier 3 (3pts deep cuts).

**Reset**: Password-protected (passcode: `2026`) via `ResetModal.tsx`.

**Styling**: Dark theme (`#0D0D0D` bg, `#D4A843` gold accent), inline CSS via React `CSSProperties`, Google Fonts (Cormorant Garamond + Outfit), mobile-first max-width 520px container.

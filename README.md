# GymOS

GymOS is a personal fitness-tracking app built around Gymmi, a natural-language AI training coach. It turns a workout request into a live, editable set-by-set session and keeps templates, notes, body weight, and performance analytics in one dark, focused interface.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without environment variables the app automatically runs in demo mode, using seeded data persisted in `localStorage`. Any email and password work on the demo login screen.

## Connect Supabase and Gemini

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor.
3. Add the Supabase URL and publishable key to `.env.local`. Legacy anonymous keys are
   also supported for existing projects.
4. Add a Gemini API key. `GEMINI_MODEL` is configurable so model changes stay outside the UI.
5. Restart the development server.

The Gemini key is used only by the server route. It is never exposed with a `NEXT_PUBLIC_` prefix.

## Main routes

- `/dashboard` — daily overview, real streak and recent activity
- `/dashboard/gymmi` — AI chat and editable live workout cards
- `/dashboard/notes` — searchable, categorized fitness journal
- `/dashboard/progress` — volume, split, records, weight and full history
- `/dashboard/workouts` — template CRUD, muscle map, start-in-Gymmi loop
- `/dashboard/exercises` — exercise index derived from logged sessions
- `/dashboard/nutrition` — focused Gymmi nutrition entry points
- `/dashboard/settings` — profile and connection status
- `/dashboard/achievements` — real-data milestones with animated badge art
- `/dashboard/community` — opt-in friends, private chat and selected workout sharing

## Production polish migration

Run [`supabase/social-and-polish.sql`](supabase/social-and-polish.sql) once after
the base schema. It adds user-scoped Gymmi conversation history and the
privacy-first social tables/policies.

For in-app permanent account deletion, add the server-only
`SUPABASE_SERVICE_ROLE_KEY` to the deployment environment. Never prefix it with
`NEXT_PUBLIC_` and never commit it.

## Data integrity

GymOS intentionally avoids invented metrics. Charts are computed from logged workouts and body-weight entries, and the Supabase policies in the included schema restrict every row to its owner.

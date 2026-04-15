# Barter App

Production MVP shell for Barter, a local-first and digital barter platform where people exchange goods and services without money.

This app is intentionally backend-first. The static prototypes in the parent workspace are preserved as references while this app builds the production MVP in small phases.

## Stack

- Next.js with TypeScript
- Supabase Auth, Postgres, Storage, and Realtime-ready helpers
- Zod validation
- SQL migrations in `supabase/migrations`

## Environment

Copy `.env.example` to `.env.local` and fill in Supabase keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

`OPENAI_API_KEY` is reserved for the later AI match feed. It is not used in Phase 1.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Phase 1 Foundation

- `src/lib/supabase`: browser, server, admin, and middleware clients
- `src/lib/validation`: no-cash, tag, listing, proposal, and gift validation
- `src/types/domain.ts`: exchange modes, statuses, and shared core types
- `supabase/migrations/0001_initial_schema.sql`: first database schema and RLS policies
- `supabase/seed.sql`: fixed MVP categories

## Phase 2 Functionality

- Browse active listings with mode, category, city, and radius filters
- Create barter, digital exchange, and gift listings
- Require city and a 1-50 km radius for local barter and gift listings
- Upload up to 3 listing images to Supabase Storage
- Use the first listing image as the cover image
- Normalize optional tags to lowercase deduplicated values
- Send barter proposals with an offered listing
- Send digital proposals with a required delivery date
- Request gifts
- Approve gift recipients
- View proposal and gift request inboxes

## Important Product Rules Represented

- No cash or payment language
- Barter, digital exchange, and gift are separate modes
- Digital exchanges require remote service assumptions and delivery dates
- Local listings require city/radius data
- Gift requests are capped at 3 active requests per user
- Reviews are modeled for completed trades or gifts only
- Notifications, events, reports, and admin moderation have schema support

## Not Built Yet

- Trade completion screens
- Messaging UI
- Admin UI
- AI match feed

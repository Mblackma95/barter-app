# Supabase Setup

This guide connects the Phase 1 Barter app to Supabase. Do these steps before Phase 2.

## 1. Create A Supabase Project

1. Go to [https://supabase.com](https://supabase.com).
2. Create a new project.
3. Choose an organization.
4. Choose a project name, for example `barter-mvp`.
5. Save the database password somewhere secure.
6. Choose the closest region to your expected users.
7. Wait for the project to finish provisioning.

## 2. Find Your API Values

In the Supabase dashboard:

1. Open your project.
2. Go to **Project Settings**.
3. Go to **API**.
4. Copy these values:

- **Project URL**
- **anon public key**
- **service_role secret key**

## 3. Create `.env.local`

In `barter-app/`, create a file named `.env.local`.

Use this format:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret_key
OPENAI_API_KEY=
```

### What Each Value Means

- `NEXT_PUBLIC_SUPABASE_URL`
  - Use the Supabase **Project URL**.
  - This is safe to expose to the browser.

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Use the Supabase **anon public key**.
  - This is safe to expose to the browser because Row Level Security controls access.

- `SUPABASE_SERVICE_ROLE_KEY`
  - Use the Supabase **service_role secret key**.
  - This must stay server-only.
  - Never expose it in frontend code.
  - Never commit `.env.local`.

- `OPENAI_API_KEY`
  - Leave blank for Phase 1.
  - This will be used later for the AI-powered match feed.

## 4. Run SQL Files

Open Supabase dashboard, then go to **SQL Editor**.

Run these files in this exact order:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_add_public_slugs.sql`
3. `supabase/migrations/0003_add_category_groups.sql`
4. `supabase/migrations/0004_listing_media_storage.sql`
5. `supabase/migrations/0005_profile_foundation.sql`
6. `supabase/migrations/0006_profile_needs_preferences.sql`
7. `supabase/migrations/0007_phase3_trades_reviews_notifications.sql`
8. `supabase/migrations/0008_blind_reviews_ai_matches.sql`
9. `supabase/migrations/0009_simplify_trade_proposal_flow.sql`
10. `supabase/migrations/0010_apply_simplified_trade_proposal_flow.sql`
11. `supabase/migrations/0011_user_circles.sql`
12. `supabase/seed.sql`

The first file creates:

- enums
- tables
- triggers
- basic no-cash enforcement
- gift request limit enforcement
- profile creation after signup
- Row Level Security policies

The second file adds:

- `username` for profiles
- `slug` for listings
- `slug` for events
- lowercase hyphen-separated slug generation
- uniqueness handling with numeric suffixes

The third file adds category groups for filtering and matching:

- Goods
- Services
- Community

The fourth file creates listing media storage support:

- `listing-media` Supabase Storage bucket
- public read policy for listing images
- authenticated upload/update/delete policies for bucket owners

Image public URLs are derived in the app from `listing_photos.storage_path`.

The fifth file adds profile foundation fields and the `profile-media` Storage bucket.
The sixth file splits profile wants/needs and adds preferred category selections.
The seventh file adds Phase 3 trade statuses, notification types, and needed RLS policies.
The eighth file adds blind-review reveal fields, review reminder tracking, and AI match opportunity storage.
The ninth file adds the simplified `pending` trade status.
The tenth file applies the simplified proposal and trade status rules for the MVP flow.
The eleventh file adds the lightweight Circle trust network table and policies.
The seed file inserts the fixed MVP categories.

## 5. Confirm Tables Exist

After running the SQL, go to **Table Editor** and confirm these tables exist:

- `profiles`
- `categories`
- `listings`
- `listing_photos`
- `proposals`
- `trades`
- `gift_requests`
- `conversations`
- `messages`
- `notifications`
- `reviews`
- `review_reminders`
- `ai_match_opportunities`
- `user_circles`
- `reports`
- `events`
- `event_rsvps`
- `safe_meetup_places`
- `moderation_events`

## 6. Confirm Categories Were Seeded

Open the `categories` table and confirm these rows exist:

- Home
- Clothing & Accessories
- Home & Furniture
- Electronics & Tech
- Books & Media
- Baby & Kids
- Sports & Outdoor Gear
- Beauty & Personal Care
- Art & Handmade Goods
- Food & Homemade Items
- Creative & Design
- Writing & Editing
- Marketing & Business Support
- Tech & IT Support
- Education & Tutoring
- Health & Wellness
- Spiritual & Energy Work
- Home Services & Repairs
- Personal Services
- Events & Workshops
- Volunteering & Community Help
- Skill Sharing
- Miscellaneous

## 7. Configure Auth

In Supabase dashboard:

1. Go to **Authentication**.
2. Go to **Providers**.
3. Make sure **Email** is enabled.
4. For local development, go to **URL Configuration**.
5. Add this Site URL:

```text
http://localhost:3000
```

6. Add this Redirect URL:

```text
http://localhost:3000/auth/callback
```

The app does not have auth screens yet. This setup prepares Supabase for them.

## 8. Run The App Locally

From `barter-app/`:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 9. Current Phase 1 Alignment

### Covered

- Barter, digital exchange, and gift are represented as separate exchange modes.
- Barter proposals require an offered listing.
- Digital proposals require a delivery date.
- Gift requests are separate from barter/digital proposals.
- Cash/payment language is blocked in listing, proposal, and gift request validation.
- Database triggers also reject common cash/payment language.
- Gift requests are limited to 3 active `pending` or `approved` requests per user.
- Listings support city and radius fields.
- Profiles support city and allowed radius fields.

### Partially Covered

- Local radius-based trades are modeled but not fully enforced yet.
  - The schema stores user radius and listing radius data.
  - The validation requires city for local listings.
  - A true distance check still needs a backend function, preferably after deciding whether to use PostGIS.

### Not Covered Yet

- Applying migrations automatically from CLI.
- Auth screens.
- Listing screens.
- Proposal creation screens.
- Gift request UI.
- Trade completion jobs.
- Review eligibility trigger.
- 24-hour pending completion flag job.
- Auto-archive job after completion.

## 10. Recommended Review Before Phase 2

Review these items before building listing, gift, and proposal screens:

- Confirm the fixed category list.
- Decide whether numeric latitude/longitude is enough for MVP or whether to add PostGIS.
- Confirm the no-cash blocklist is acceptable.
- Confirm whether `Digital Services` and `Community` should remain MVP categories.
- Confirm whether events are admin-created only for MVP.

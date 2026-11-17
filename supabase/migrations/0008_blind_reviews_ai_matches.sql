alter type public.notification_type add value if not exists 'ai_match';

alter table public.reviews
add column if not exists review_deadline_at timestamptz,
add column if not exists visible_at timestamptz;

update public.reviews
set
  review_deadline_at = coalesce(review_deadline_at, created_at),
  visible_at = coalesce(visible_at, created_at)
where review_deadline_at is null
   or visible_at is null;

create table if not exists public.review_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete cascade,
  gift_request_id uuid references public.gift_requests(id) on delete cascade,
  sent_at timestamptz not null default now(),
  constraint review_reminders_one_context check (
    (trade_id is not null and gift_request_id is null)
    or (trade_id is null and gift_request_id is not null)
  ),
  unique (user_id, trade_id),
  unique (user_id, gift_request_id)
);

create table if not exists public.ai_match_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  score numeric(5,2) not null default 0,
  reasons text[] not null default '{}',
  status text not null default 'new',
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

alter table public.review_reminders enable row level security;
alter table public.ai_match_opportunities enable row level security;

drop policy if exists "Users can read their own review reminders" on public.review_reminders;
create policy "Users can read their own review reminders" on public.review_reminders
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can read their own AI matches" on public.ai_match_opportunities;
create policy "Users can read their own AI matches" on public.ai_match_opportunities
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create extension if not exists "pgcrypto";

create type public.exchange_mode as enum ('barter', 'digital', 'gift');
create type public.listing_status as enum ('draft', 'active', 'pending', 'completed', 'archived', 'removed');
create type public.proposal_status as enum ('pending', 'accepted', 'declined', 'cancelled', 'expired');
create type public.trade_status as enum ('agreed', 'pending_completion', 'completed', 'flagged', 'cancelled');
create type public.gift_request_status as enum ('pending', 'approved', 'declined', 'cancelled', 'completed');
create type public.message_context_type as enum ('proposal', 'trade', 'gift_request');
create type public.notification_type as enum (
  'proposal_received',
  'proposal_updated',
  'message_received',
  'trade_agreed',
  'completion_confirmed',
  'completion_flagged',
  'gift_requested',
  'gift_approved',
  'review_available',
  'event_reminder',
  'admin_notice'
);
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  avatar_url text,
  city text not null default '',
  neighborhood text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  allowed_radius_km numeric(5,2) not null default 10,
  gifts_given_count integer not null default 0,
  trust_score numeric(5,2) not null default 0,
  is_admin boolean not null default false,
  is_suspended boolean not null default false,
  notification_level text not null default 'moderate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_radius_positive check (allowed_radius_km > 0),
  constraint profiles_gifts_nonnegative check (gifts_given_count >= 0)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  exchange_mode public.exchange_mode not null,
  status public.listing_status not null default 'draft',
  title text not null,
  description text not null,
  category_id uuid not null references public.categories(id),
  tags text[] not null default '{}',
  city text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  local_radius_km numeric(5,2),
  is_remote boolean not null default false,
  wanted text,
  delivery_date_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint listings_digital_is_remote check (exchange_mode <> 'digital' or is_remote = true),
  constraint listings_local_modes_have_city check (exchange_mode = 'digital' or city is not null),
  constraint listings_radius_positive check (local_radius_km is null or local_radius_km > 0)
);

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  mode public.exchange_mode not null,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  target_listing_id uuid not null references public.listings(id) on delete cascade,
  offered_listing_id uuid references public.listings(id) on delete set null,
  note text,
  delivery_date date,
  status public.proposal_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposals_not_self check (requester_id <> recipient_id),
  constraint proposals_no_gift_mode check (mode in ('barter', 'digital')),
  constraint proposals_barter_requires_offered_listing check (mode <> 'barter' or offered_listing_id is not null),
  constraint proposals_digital_requires_delivery_date check (mode <> 'digital' or delivery_date is not null)
);

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null unique references public.proposals(id) on delete cascade,
  mode public.exchange_mode not null,
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  target_listing_id uuid not null references public.listings(id),
  offered_listing_id uuid references public.listings(id),
  status public.trade_status not null default 'agreed',
  agreed_at timestamptz not null default now(),
  exact_address_visible boolean not null default false,
  meetup_suggestion text,
  user_a_confirmed_at timestamptz,
  user_b_confirmed_at timestamptz,
  pending_completion_started_at timestamptz,
  completed_at timestamptz,
  flagged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trades_not_self check (user_a_id <> user_b_id),
  constraint trades_no_gift_mode check (mode in ('barter', 'digital'))
);

create table public.gift_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  giver_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status public.gift_request_status not null default 'pending',
  approved_at timestamptz,
  requester_confirmed_at timestamptz,
  giver_confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gifts_not_self check (requester_id <> giver_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  context_type public.message_context_type not null,
  context_id uuid not null,
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_not_self check (user_a_id <> user_b_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete cascade,
  gift_request_id uuid references public.gift_requests(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  constraint reviews_not_self check (reviewer_id <> reviewee_id),
  constraint reviews_one_context check (
    (trade_id is not null and gift_request_id is null)
    or (trade_id is null and gift_request_id is not null)
  ),
  unique (reviewer_id, trade_id),
  unique (reviewer_id, gift_request_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  proposal_id uuid references public.proposals(id) on delete set null,
  trade_id uuid references public.trades(id) on delete set null,
  gift_request_id uuid references public.gift_requests(id) on delete set null,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  city text,
  venue_name text,
  address text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.safe_meetup_places (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  name text not null,
  address text not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  place_type text not null default 'public_space',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  action text not null,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.normalize_listing_tags()
returns trigger
language plpgsql
as $$
begin
  new.tags = coalesce(
    (
      select array_agg(distinct lower(trim(tag)))
      from unnest(new.tags) as tag
      where trim(tag) <> ''
    ),
    '{}'::text[]
  );
  return new;
end;
$$;

create or replace function public.reject_listing_cash_language()
returns trigger
language plpgsql
as $$
begin
  if (coalesce(new.title, '') || ' ' || coalesce(new.description, '') || ' ' || coalesce(new.wanted, ''))
    ~* '\m(cash|money|dollars?|bucks?|e-transfer|etransfer|venmo|paypal|stripe|payment|paid|price)\M|[$]' then
    raise exception 'Cash, payments, prices, and money language are not allowed on Barter.';
  end if;
  return new;
end;
$$;

create or replace function public.reject_proposal_cash_language()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.note, '') ~* '\m(cash|money|dollars?|bucks?|e-transfer|etransfer|venmo|paypal|stripe|payment|paid|price)\M|[$]' then
    raise exception 'Cash or payment language is not allowed in proposals.';
  end if;
  return new;
end;
$$;

create or replace function public.reject_gift_cash_language()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.message, '') ~* '\m(cash|money|dollars?|bucks?|e-transfer|etransfer|venmo|paypal|stripe|payment|paid|price)\M|[$]' then
    raise exception 'Gift requests cannot include cash or payment language.';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_gift_request_limit()
returns trigger
language plpgsql
as $$
declare
  active_count integer;
begin
  if new.status in ('pending', 'approved') then
    select count(*)
    into active_count
    from public.gift_requests
    where requester_id = new.requester_id
      and status in ('pending', 'approved')
      and id <> new.id;

    if active_count >= 3 then
      raise exception 'Users can have at most 3 active gift requests.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Barter user'),
    coalesce(new.raw_user_meta_data->>'city', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
as $$
begin
  if not public.is_admin() then
    new.gifts_given_count = old.gifts_given_count;
    new.trust_score = old.trust_score;
    new.is_admin = old.is_admin;
    new.is_suspended = old.is_suspended;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger profiles_protect_system_fields
before update on public.profiles
for each row execute function public.protect_profile_system_fields();

create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger listings_touch_updated_at before update on public.listings
for each row execute function public.touch_updated_at();
create trigger proposals_touch_updated_at before update on public.proposals
for each row execute function public.touch_updated_at();
create trigger trades_touch_updated_at before update on public.trades
for each row execute function public.touch_updated_at();
create trigger gift_requests_touch_updated_at before update on public.gift_requests
for each row execute function public.touch_updated_at();
create trigger conversations_touch_updated_at before update on public.conversations
for each row execute function public.touch_updated_at();
create trigger reports_touch_updated_at before update on public.reports
for each row execute function public.touch_updated_at();
create trigger events_touch_updated_at before update on public.events
for each row execute function public.touch_updated_at();

create trigger normalize_listing_tags_before_write before insert or update on public.listings
for each row execute function public.normalize_listing_tags();
create trigger reject_cash_language_on_listings before insert or update on public.listings
for each row execute function public.reject_listing_cash_language();
create trigger reject_cash_language_on_proposals before insert or update on public.proposals
for each row execute function public.reject_proposal_cash_language();
create trigger reject_cash_language_on_gift_requests before insert or update on public.gift_requests
for each row execute function public.reject_gift_cash_language();
create trigger enforce_gift_request_limit_before_write before insert or update on public.gift_requests
for each row execute function public.enforce_gift_request_limit();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.proposals enable row level security;
alter table public.trades enable row level security;
alter table public.gift_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.safe_meetup_places enable row level security;
alter table public.moderation_events enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
      and is_suspended = false
  );
$$;

create policy "Profiles are readable by authenticated users" on public.profiles
for select to authenticated using (true);

create policy "Users can update their own profile" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Categories are public" on public.categories
for select to anon, authenticated using (is_active = true or public.is_admin());

create policy "Active listings are public" on public.listings
for select to anon, authenticated
using (status = 'active' or owner_id = auth.uid() or public.is_admin());

create policy "Users manage their own listings" on public.listings
for all to authenticated
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

create policy "Listing photos follow listing visibility" on public.listing_photos
for select to anon, authenticated
using (
  exists (
    select 1 from public.listings
    where listings.id = listing_photos.listing_id
      and (listings.status = 'active' or listings.owner_id = auth.uid() or public.is_admin())
  )
);

create policy "Listing owners manage photos" on public.listing_photos
for all to authenticated
using (
  exists (
    select 1 from public.listings
    where listings.id = listing_photos.listing_id
      and (listings.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.listings
    where listings.id = listing_photos.listing_id
      and (listings.owner_id = auth.uid() or public.is_admin())
  )
);

create policy "Proposal participants can read" on public.proposals
for select to authenticated
using (requester_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());

create policy "Users can create their own proposals" on public.proposals
for insert to authenticated
with check (requester_id = auth.uid() and requester_id <> recipient_id);

create policy "Proposal participants can update" on public.proposals
for update to authenticated
using (requester_id = auth.uid() or recipient_id = auth.uid() or public.is_admin())
with check (requester_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());

create policy "Trade participants can read" on public.trades
for select to authenticated
using (user_a_id = auth.uid() or user_b_id = auth.uid() or public.is_admin());

create policy "Trade participants can update" on public.trades
for update to authenticated
using (user_a_id = auth.uid() or user_b_id = auth.uid() or public.is_admin())
with check (user_a_id = auth.uid() or user_b_id = auth.uid() or public.is_admin());

create policy "Gift participants can read" on public.gift_requests
for select to authenticated
using (requester_id = auth.uid() or giver_id = auth.uid() or public.is_admin());

create policy "Users can request gifts" on public.gift_requests
for insert to authenticated
with check (requester_id = auth.uid() and requester_id <> giver_id);

create policy "Gift participants can update" on public.gift_requests
for update to authenticated
using (requester_id = auth.uid() or giver_id = auth.uid() or public.is_admin())
with check (requester_id = auth.uid() or giver_id = auth.uid() or public.is_admin());

create policy "Conversation participants can read" on public.conversations
for select to authenticated
using (user_a_id = auth.uid() or user_b_id = auth.uid() or public.is_admin());

create policy "Conversation participants can write" on public.conversations
for insert to authenticated
with check (user_a_id = auth.uid() or user_b_id = auth.uid() or public.is_admin());

create policy "Conversation participants can read messages" on public.messages
for select to authenticated
using (
  exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and (conversations.user_a_id = auth.uid() or conversations.user_b_id = auth.uid() or public.is_admin())
  )
);

create policy "Conversation participants can send messages" on public.messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and (conversations.user_a_id = auth.uid() or conversations.user_b_id = auth.uid())
  )
);

create policy "Users can read their own notifications" on public.notifications
for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "Users can update their own notifications" on public.notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Reviews are readable" on public.reviews
for select to authenticated using (true);

create policy "Users can create their own reviews" on public.reviews
for insert to authenticated with check (reviewer_id = auth.uid() and reviewer_id <> reviewee_id);

create policy "Users can create reports" on public.reports
for insert to authenticated with check (reporter_id = auth.uid());

create policy "Admins can manage reports" on public.reports
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Published events are public" on public.events
for select to anon, authenticated using (is_published = true or public.is_admin());

create policy "Admins manage events" on public.events
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Users manage their RSVPs" on public.event_rsvps
for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "Safe meetup places are public" on public.safe_meetup_places
for select to anon, authenticated using (is_active = true or public.is_admin());

create policy "Admins manage safe meetup places" on public.safe_meetup_places
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage moderation events" on public.moderation_events
for all to authenticated using (public.is_admin()) with check (public.is_admin());

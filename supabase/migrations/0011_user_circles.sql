create table if not exists public.user_circles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  circle_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, circle_user_id),
  constraint user_circles_not_self check (user_id <> circle_user_id)
);

alter table public.user_circles enable row level security;

drop policy if exists "Users can read their own circle" on public.user_circles;
create policy "Users can read their own circle" on public.user_circles
for select to authenticated
using (user_id = auth.uid() or circle_user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can add to their own circle" on public.user_circles;
create policy "Users can add to their own circle" on public.user_circles
for insert to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can remove from their own circle" on public.user_circles;
create policy "Users can remove from their own circle" on public.user_circles
for delete to authenticated
using (user_id = auth.uid() or public.is_admin());

alter type public.trade_status add value if not exists 'accepted';
alter type public.trade_status add value if not exists 'scheduled';
alter type public.trade_status add value if not exists 'in_progress';
alter type public.trade_status add value if not exists 'canceled';
alter type public.trade_status add value if not exists 'disputed';

alter type public.notification_type add value if not exists 'proposal_accepted';
alter type public.notification_type add value if not exists 'proposal_declined';
alter type public.notification_type add value if not exists 'trade_created';
alter type public.notification_type add value if not exists 'trade_status_changed';
alter type public.notification_type add value if not exists 'pending_completion';
alter type public.notification_type add value if not exists 'review_prompt';

alter table public.trades
alter column status set default 'accepted';

update public.trades
set status = 'accepted'
where status = 'agreed';

update public.trades
set status = 'disputed'
where status = 'flagged';

update public.trades
set status = 'canceled'
where status = 'cancelled';

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists "Trade participants can create trades" on public.trades;
create policy "Trade participants can create trades" on public.trades
for insert to authenticated
with check (user_a_id = auth.uid() or user_b_id = auth.uid() or public.is_admin());

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications" on public.notifications
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications" on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

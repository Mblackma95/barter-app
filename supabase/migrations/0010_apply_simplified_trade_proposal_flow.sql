alter table public.trades
alter column status set default 'pending';

update public.proposals
set status = 'declined'
where status in ('cancelled', 'expired');

update public.trades
set status = 'pending'
where status in ('agreed', 'accepted', 'scheduled', 'in_progress', 'pending_completion');

update public.trades
set status = 'disputed'
where status = 'flagged';

update public.trades
set status = 'canceled'
where status = 'cancelled';

alter table public.proposals
drop constraint if exists proposals_mvp_status_check;

alter table public.proposals
add constraint proposals_mvp_status_check
check (status in ('pending', 'accepted', 'declined'));

alter table public.trades
drop constraint if exists trades_mvp_status_check;

alter table public.trades
add constraint trades_mvp_status_check
check (status in ('pending', 'completed', 'canceled', 'disputed'));

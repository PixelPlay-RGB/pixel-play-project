-- Merge overlapping authenticated SELECT policies raised by Supabase advisors.
-- This keeps the same read surface while avoiding multiple permissive policies per table/action.

drop policy if exists "Anyone can read active live broadcasts" on public.live_broadcast;
drop policy if exists "Creators can read own live broadcasts" on public.live_broadcast;
create policy "Anon can read active live broadcasts"
on public.live_broadcast for select
to anon
using (ended_at is null);
create policy "Authenticated users can read visible live broadcasts"
on public.live_broadcast for select
to authenticated
using (
  ended_at is null
  or creator_id = (select auth.uid() as uid)
);

drop policy if exists "Viewers can read own creator relations" on public.viewer_creator_relation;
drop policy if exists "Creators can read viewer relations for own channel" on public.viewer_creator_relation;
create policy "Authenticated users can read related creator relations"
on public.viewer_creator_relation for select
to authenticated
using (
  viewer_id = (select auth.uid() as uid)
  or creator_id = (select auth.uid() as uid)
);

drop policy if exists "Users can read own sent donations" on public.donation;
drop policy if exists "Creators can read received donations" on public.donation;
create policy "Authenticated users can read related donations"
on public.donation for select
to authenticated
using (
  donor_id = (select auth.uid() as uid)
  or creator_id = (select auth.uid() as uid)
);

drop policy if exists "Voters can read own live poll votes" on public.live_poll_vote;
drop policy if exists "Creators can read votes for own live polls" on public.live_poll_vote;
create policy "Authenticated users can read related live poll votes"
on public.live_poll_vote for select
to authenticated
using (
  voter_id = (select auth.uid() as uid)
  or exists (
    select 1
    from public.live_poll as poll
    join public.live_broadcast as broadcast
      on broadcast.id = poll.broadcast_id
    where poll.id = live_poll_vote.poll_id
      and broadcast.creator_id = (select auth.uid() as uid)
  )
);

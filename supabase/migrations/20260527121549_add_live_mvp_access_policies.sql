-- Live MVP access policies and realtime publication.
-- Direct writes stay behind service_role RPCs. Public reads are limited to active live data.

revoke all privileges on table public.creator_studio_setting from public;
revoke all privileges on table public.creator_studio_setting from anon;
revoke all privileges on table public.creator_studio_setting from authenticated;
grant select, insert, update, delete on table public.creator_studio_setting to service_role;

revoke all privileges on table public.live_broadcast from public;
revoke all privileges on table public.live_broadcast from anon;
revoke all privileges on table public.live_broadcast from authenticated;
grant select on table public.live_broadcast to anon;
grant select on table public.live_broadcast to authenticated;
grant select, insert, update, delete on table public.live_broadcast to service_role;

revoke all privileges on table public.live_message from public;
revoke all privileges on table public.live_message from anon;
revoke all privileges on table public.live_message from authenticated;
grant select on table public.live_message to anon;
grant select on table public.live_message to authenticated;
grant select, insert, update, delete on table public.live_message to service_role;

revoke all privileges on table public.viewer_creator_relation from public;
revoke all privileges on table public.viewer_creator_relation from anon;
revoke all privileges on table public.viewer_creator_relation from authenticated;
grant select on table public.viewer_creator_relation to authenticated;
grant select, insert, update, delete on table public.viewer_creator_relation to service_role;

revoke all privileges on table public.wallet_account from public;
revoke all privileges on table public.wallet_account from anon;
revoke all privileges on table public.wallet_account from authenticated;
grant select on table public.wallet_account to authenticated;
grant select, insert, update, delete on table public.wallet_account to service_role;

revoke all privileges on table public.wallet_transaction from public;
revoke all privileges on table public.wallet_transaction from anon;
revoke all privileges on table public.wallet_transaction from authenticated;
grant select on table public.wallet_transaction to authenticated;
grant select, insert, update, delete on table public.wallet_transaction to service_role;

revoke all privileges on table public.donation from public;
revoke all privileges on table public.donation from anon;
revoke all privileges on table public.donation from authenticated;
grant select on table public.donation to authenticated;
grant select, insert, update, delete on table public.donation to service_role;

revoke all privileges on table public.live_poll from public;
revoke all privileges on table public.live_poll from anon;
revoke all privileges on table public.live_poll from authenticated;
grant select on table public.live_poll to anon;
grant select on table public.live_poll to authenticated;
grant select, insert, update, delete on table public.live_poll to service_role;

revoke all privileges on table public.live_poll_vote from public;
revoke all privileges on table public.live_poll_vote from anon;
revoke all privileges on table public.live_poll_vote from authenticated;
grant select on table public.live_poll_vote to authenticated;
grant select, insert, update, delete on table public.live_poll_vote to service_role;

drop policy if exists "Creators can read own studio settings" on public.creator_studio_setting;
create policy "Creators can read own studio settings"
on public.creator_studio_setting for select
to authenticated
using (creator_id = (select auth.uid() as uid));

drop policy if exists "Anyone can read active live broadcasts" on public.live_broadcast;
create policy "Anyone can read active live broadcasts"
on public.live_broadcast for select
to anon, authenticated
using (ended_at is null);

drop policy if exists "Creators can read own live broadcasts" on public.live_broadcast;
create policy "Creators can read own live broadcasts"
on public.live_broadcast for select
to authenticated
using (creator_id = (select auth.uid() as uid));

drop policy if exists "Anyone can read active live messages" on public.live_message;
create policy "Anyone can read active live messages"
on public.live_message for select
to anon, authenticated
using (
  exists (
    select 1
    from public.live_broadcast as broadcast
    where broadcast.id = live_message.broadcast_id
      and broadcast.ended_at is null
  )
);

drop policy if exists "Viewers can read own creator relations" on public.viewer_creator_relation;
create policy "Viewers can read own creator relations"
on public.viewer_creator_relation for select
to authenticated
using (viewer_id = (select auth.uid() as uid));

drop policy if exists "Creators can read viewer relations for own channel" on public.viewer_creator_relation;
create policy "Creators can read viewer relations for own channel"
on public.viewer_creator_relation for select
to authenticated
using (creator_id = (select auth.uid() as uid));

drop policy if exists "Users can read own wallet account" on public.wallet_account;
create policy "Users can read own wallet account"
on public.wallet_account for select
to authenticated
using (user_id = (select auth.uid() as uid));

drop policy if exists "Users can read own wallet transactions" on public.wallet_transaction;
create policy "Users can read own wallet transactions"
on public.wallet_transaction for select
to authenticated
using (user_id = (select auth.uid() as uid));

drop policy if exists "Users can read own sent donations" on public.donation;
create policy "Users can read own sent donations"
on public.donation for select
to authenticated
using (donor_id = (select auth.uid() as uid));

drop policy if exists "Creators can read received donations" on public.donation;
create policy "Creators can read received donations"
on public.donation for select
to authenticated
using (creator_id = (select auth.uid() as uid));

drop policy if exists "Anyone can read active live polls" on public.live_poll;
create policy "Anyone can read active live polls"
on public.live_poll for select
to anon, authenticated
using (
  exists (
    select 1
    from public.live_broadcast as broadcast
    where broadcast.id = live_poll.broadcast_id
      and broadcast.ended_at is null
  )
);

drop policy if exists "Voters can read own live poll votes" on public.live_poll_vote;
create policy "Voters can read own live poll votes"
on public.live_poll_vote for select
to authenticated
using (voter_id = (select auth.uid() as uid));

drop policy if exists "Creators can read votes for own live polls" on public.live_poll_vote;
create policy "Creators can read votes for own live polls"
on public.live_poll_vote for select
to authenticated
using (
  exists (
    select 1
    from public.live_poll as poll
    join public.live_broadcast as broadcast
      on broadcast.id = poll.broadcast_id
    where poll.id = live_poll_vote.poll_id
      and broadcast.creator_id = (select auth.uid() as uid)
  )
);

do $$
declare
  v_schema text;
  v_table_name text;
begin
  for v_schema, v_table_name in
    values
      ('public', 'live_broadcast'),
      ('public', 'live_message'),
      ('public', 'donation'),
      ('public', 'live_poll'),
      ('public', 'live_poll_vote')
  loop
    if not exists (
      select 1
      from pg_publication_tables as publication_table
      where publication_table.pubname = 'supabase_realtime'
        and publication_table.schemaname = v_schema
        and publication_table.tablename = v_table_name
    ) then
      execute format('alter publication supabase_realtime add table %I.%I', v_schema, v_table_name);
    end if;
  end loop;
end;
$$;

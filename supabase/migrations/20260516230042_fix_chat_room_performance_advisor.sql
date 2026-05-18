-- Supabase Performance Advisor 경고를 정리한다.

create index if not exists chat_room_owner_id_idx
on public.chat_room using btree (owner_id);

drop policy if exists "Users can update own room member read and joined state"
on public.chat_room_member;

create policy "Users can update own room member read and joined state"
on public.chat_room_member
for update
to authenticated
using (
  user_id = (select auth.uid())
  and is_banned = false
)
with check (
  user_id = (select auth.uid())
  and is_banned = false
);

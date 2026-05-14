-- 기존 join_chat_room RPC 폐기 (status 5종 반환하던 복잡한 버전)
drop function if exists public.join_chat_room(uuid);

-- 신규 join_chat_room: 단순 upsert (security invoker로 RLS 위임)
create or replace function public.join_chat_room(p_room_id uuid)
returns void
language sql
security invoker
set search_path = public, auth
as $$
  insert into public.chat_room_member (chat_room_id, user_id, last_joined_at)
  values (p_room_id, auth.uid(), now())
  on conflict (chat_room_id, user_id)
  do update set last_joined_at = now();
$$;

-- 재참여(last_joined_at NULL → 값) 시 정원 초과 차단 트리거
create or replace function public.check_chat_room_capacity_on_rejoin()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_current_member smallint;
  v_max_capacity smallint;
begin
  if old.last_joined_at is null and new.last_joined_at is not null then
    select current_member, max_capacity
    into v_current_member, v_max_capacity
    from public.chat_room
    where id = new.chat_room_id;

    if v_current_member >= v_max_capacity then
      raise exception 'chat room is full';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_check_capacity_on_rejoin on public.chat_room_member;
create trigger trigger_check_capacity_on_rejoin
before update on public.chat_room_member
for each row execute function public.check_chat_room_capacity_on_rejoin();

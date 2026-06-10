-- 라이브 시청자 수(current_viewer_count) writer.
-- 시청 화면이 주기적으로 보내는 하트비트를 모아 활성 시청자 수를 재계산하고
-- live_broadcast.current_viewer_count를 갱신한다. 이 UPDATE가 realtime 이벤트를 발생시켜
-- 시청 화면과 통계 화면(동일 컬럼 구독)을 동시에 갱신한다.
--
-- viewer_key는 로그인 시청자('u:'+userId)와 익명 시청자('a:'+세션토큰)를 모두 식별한다.
-- 익명도 집계 대상이므로 user FK를 두지 않는다. 식별 키는 서버 액션에서 계산한다.

create table if not exists public.live_viewer_heartbeat (
  broadcast_id uuid not null references public.live_broadcast (id) on delete cascade,
  viewer_key text not null,
  last_seen_at timestamp with time zone not null default now(),
  primary key (broadcast_id, viewer_key)
);

create index if not exists live_viewer_heartbeat_broadcast_last_seen_idx
  on public.live_viewer_heartbeat using btree (broadcast_id, last_seen_at);

alter table public.live_viewer_heartbeat enable row level security;

revoke all privileges on table public.live_viewer_heartbeat from public;
revoke all privileges on table public.live_viewer_heartbeat from anon;
revoke all privileges on table public.live_viewer_heartbeat from authenticated;
grant select, insert, update, delete on table public.live_viewer_heartbeat to service_role;

-- 20초 윈도 밖 하트비트 정리 + 신선한 시청자 수 재계산 + current_viewer_count 반영(공용).
-- sync/leave가 공유한다. 윈도·집계 정책 변경 시 이 한 곳만 고치면 된다.
create or replace function public.recompute_live_viewer_count(p_broadcast_id uuid)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_window constant interval := interval '20 seconds';
  v_count integer;
begin
  delete from public.live_viewer_heartbeat as hb
  where hb.broadcast_id = p_broadcast_id
    and hb.last_seen_at < now() - v_window;

  select count(*)::integer
  into v_count
  from public.live_viewer_heartbeat as hb
  where hb.broadcast_id = p_broadcast_id;

  update public.live_broadcast as broadcast
  set current_viewer_count = v_count
  where broadcast.id = p_broadcast_id
    and broadcast.current_viewer_count is distinct from v_count;

  return v_count;
end;
$function$;

-- 하트비트 upsert 후 시청자 수 재계산.
create or replace function public.sync_live_viewer_presence(
  p_broadcast_id uuid,
  p_viewer_key text
)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_key text := btrim(coalesce(p_viewer_key, ''));
begin
  if p_broadcast_id is null then
    raise sqlstate 'PX400' using message = 'invalid broadcast';
  end if;

  if v_key = '' then
    raise sqlstate 'PX400' using message = 'invalid viewer key';
  end if;

  if not exists (
    select 1
    from public.live_broadcast as broadcast
    where broadcast.id = p_broadcast_id
      and broadcast.ended_at is null
  ) then
    raise sqlstate 'PX404' using message = 'active live broadcast not found';
  end if;

  insert into public.live_viewer_heartbeat as hb (broadcast_id, viewer_key, last_seen_at)
  values (p_broadcast_id, v_key, now())
  on conflict (broadcast_id, viewer_key) do update
    set last_seen_at = now();

  return public.recompute_live_viewer_count(p_broadcast_id);
end;
$function$;

-- 시청 화면 이탈 시 본인 하트비트를 제거하고 시청자 수를 다시 반영한다.
create or replace function public.leave_live_viewer_presence(
  p_broadcast_id uuid,
  p_viewer_key text
)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_key text := btrim(coalesce(p_viewer_key, ''));
begin
  if p_broadcast_id is null or v_key = '' then
    return 0;
  end if;

  delete from public.live_viewer_heartbeat as hb
  where hb.broadcast_id = p_broadcast_id
    and hb.viewer_key = v_key;

  return public.recompute_live_viewer_count(p_broadcast_id);
end;
$function$;

revoke execute on function public.recompute_live_viewer_count(uuid) from public;
revoke execute on function public.recompute_live_viewer_count(uuid) from anon;
revoke execute on function public.recompute_live_viewer_count(uuid) from authenticated;
grant execute on function public.recompute_live_viewer_count(uuid) to service_role;

revoke execute on function public.sync_live_viewer_presence(uuid, text) from public;
revoke execute on function public.sync_live_viewer_presence(uuid, text) from anon;
revoke execute on function public.sync_live_viewer_presence(uuid, text) from authenticated;
grant execute on function public.sync_live_viewer_presence(uuid, text) to service_role;

revoke execute on function public.leave_live_viewer_presence(uuid, text) from public;
revoke execute on function public.leave_live_viewer_presence(uuid, text) from anon;
revoke execute on function public.leave_live_viewer_presence(uuid, text) from authenticated;
grant execute on function public.leave_live_viewer_presence(uuid, text) to service_role;

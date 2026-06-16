-- 라이브 시청자 수 집계 핫패스 최적화 (#97 B).
-- 기존: 하트비트마다(시청자당 10초 주기) stale DELETE + 전체 count(*) + live_broadcast UPDATE를
-- 전부 수행해 동시시청 N명이면 초당 N/10 RPC × O(N) 스캔(O(N²) 성격) + 같은 행 UPDATE 경합이 생겼다.
-- 변경: 이벤트-게이트 재집계 — 단순 하트비트 갱신(대다수)은 upsert만 O(1)로 끝내고,
-- 멤버십이 실제로 바뀌는 순간(신규 진입·만료 복귀·실제 삭제된 이탈)에만 재집계한다.
-- 재집계는 매번 신선 윈도 전체 count(*)라 증분 카운터와 달리 drift가 구조적으로 불가능(자가 보정).
-- stale 행 물리 삭제는 sweep_live_viewer_counts(pg_cron 30초, 보정 전담)로 일원화한다.
-- 시그니처·반환 타입은 전부 유지되므로 클라이언트(서버 액션·훅·beacon 라우트)는 무변경이다.

-- 신선 하트비트 판정 윈도의 단일 소스. recompute/sync/sweep이 공유한다(변경 시 이 한 곳만).
create or replace function public.live_viewer_presence_window()
returns interval
language sql
immutable
set search_path to ''
as $function$
  select interval '20 seconds'
$function$;

revoke execute on function public.live_viewer_presence_window() from public;
revoke execute on function public.live_viewer_presence_window() from anon;
revoke execute on function public.live_viewer_presence_window() from authenticated;
grant execute on function public.live_viewer_presence_window() to service_role;

-- 신선한 시청자 수 재계산 + current_viewer_count 반영(공용).
-- 핫패스에서 DELETE를 제거 — stale 행은 카운트에서 윈도 필터로 제외하고 물리 삭제는 sweep 전담.
-- 인덱스 (broadcast_id, last_seen_at)이 윈도 필터 카운트를 그대로 커버한다.
create or replace function public.recompute_live_viewer_count(p_broadcast_id uuid)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_count integer;
begin
  select count(*)::integer
  into v_count
  from public.live_viewer_heartbeat as hb
  where hb.broadcast_id = p_broadcast_id
    and hb.last_seen_at >= now() - public.live_viewer_presence_window();

  update public.live_broadcast as broadcast
  set current_viewer_count = v_count
  where broadcast.id = p_broadcast_id
    and broadcast.current_viewer_count is distinct from v_count;

  return v_count;
end;
$function$;

-- 하트비트 upsert. 재집계는 멤버십이 바뀌는 진입 이벤트(신규/만료 복귀)에만 수행한다.
-- now()는 트랜잭션 내 고정이므로 게이트 판정과 recompute의 윈도 기준이 항상 일치한다.
-- 동시 첫 진입 2건이 둘 다 게이트를 통과해도 recompute는 전체 카운트라 멱등(드리프트 없음).
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
  v_current integer;
  v_prev timestamp with time zone;
begin
  if p_broadcast_id is null then
    raise sqlstate 'PX400' using message = 'invalid broadcast';
  end if;

  if v_key = '' then
    raise sqlstate 'PX400' using message = 'invalid viewer key';
  end if;

  select broadcast.current_viewer_count
  into v_current
  from public.live_broadcast as broadcast
  where broadcast.id = p_broadcast_id
    and broadcast.ended_at is null;

  if not found then
    raise sqlstate 'PX404' using message = 'active live broadcast not found';
  end if;

  select hb.last_seen_at
  into v_prev
  from public.live_viewer_heartbeat as hb
  where hb.broadcast_id = p_broadcast_id
    and hb.viewer_key = v_key;

  insert into public.live_viewer_heartbeat as hb (broadcast_id, viewer_key, last_seen_at)
  values (p_broadcast_id, v_key, now())
  on conflict (broadcast_id, viewer_key) do update
    set last_seen_at = now();

  -- 이 게이트는 성능 최적화일 뿐 정확성 책임이 없다 — 게이트가 놓친 변화(예: 타임아웃 감소)는
  -- sweep_live_viewer_counts가 보정한다. 게이트 조건을 바꿔도 sweep의 전 방송 재계산은 유지할 것.
  if v_prev is null or v_prev < now() - public.live_viewer_presence_window() then
    return public.recompute_live_viewer_count(p_broadcast_id);
  end if;

  -- 단순 갱신(대다수 경로): 카운트 불변이므로 재집계·UPDATE 없이 현재 값만 반환.
  return v_current;
end;
$function$;

-- 시청 화면 이탈. 하트비트가 실제로 삭제됐을 때만 재집계한다 —
-- beacon(pagehide)과 React cleanup이 중복 발화해도 두 번째 호출은 no-op.
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
  v_deleted integer;
begin
  if p_broadcast_id is null or v_key = '' then
    return 0;
  end if;

  delete from public.live_viewer_heartbeat as hb
  where hb.broadcast_id = p_broadcast_id
    and hb.viewer_key = v_key;

  get diagnostics v_deleted = row_count;

  if v_deleted > 0 then
    return public.recompute_live_viewer_count(p_broadcast_id);
  end if;

  return coalesce(
    (
      select broadcast.current_viewer_count
      from public.live_broadcast as broadcast
      where broadcast.id = p_broadcast_id
    ),
    0
  );
end;
$function$;

-- sweep은 기존 역할 그대로(전역 stale 물리 삭제 + 활성 방송 보정) — 윈도만 단일 소스로 교체.
-- 핫패스에서 DELETE가 빠지면서 stale 행 정리는 이 함수가 유일한 소유자가 된다.
create or replace function public.sweep_live_viewer_counts()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  -- 1) 전역 stale 하트비트 정리.
  delete from public.live_viewer_heartbeat as hb
  where hb.last_seen_at < now() - public.live_viewer_presence_window();

  -- 2) 활성 방송 카운트를 신선한 하트비트 수로 재계산(하트비트 없으면 0). 값이 바뀔 때만 UPDATE.
  update public.live_broadcast as b
  set current_viewer_count = c.cnt
  from (
    select b2.id, count(hb.broadcast_id)::int as cnt
    from public.live_broadcast as b2
    left join public.live_viewer_heartbeat as hb on hb.broadcast_id = b2.id
    where b2.ended_at is null
    group by b2.id
  ) as c
  where b.id = c.id
    and b.current_viewer_count is distinct from c.cnt;
end;
$function$;

-- create or replace는 기존 ACL을 보존하지만, 미러 명시성을 위해 service_role 전용을 재선언한다.
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

revoke execute on function public.sweep_live_viewer_counts() from public;
revoke execute on function public.sweep_live_viewer_counts() from anon;
revoke execute on function public.sweep_live_viewer_counts() from authenticated;
grant execute on function public.sweep_live_viewer_counts() to service_role;

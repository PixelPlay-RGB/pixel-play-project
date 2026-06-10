-- 빈 방 시청자 수 수렴용 주기 sweep.
-- 하트비트 정리는 평소 sync/leave가 그 방송에 호출될 때만 일어나므로, 마지막 시청자가
-- 탭을 하드 종료(React cleanup 미실행)하면 current_viewer_count가 0으로 안 떨어진다.
-- pg_cron으로 30초마다 전역 stale 정리 + 활성 방송 카운트 재계산해 0까지 수렴시킨다.

create extension if not exists pg_cron;

create or replace function public.sweep_live_viewer_counts()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_window constant interval := interval '20 seconds';
begin
  -- 1) 전역 stale 하트비트 정리.
  delete from public.live_viewer_heartbeat as hb
  where hb.last_seen_at < now() - v_window;

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

revoke execute on function public.sweep_live_viewer_counts() from public;
revoke execute on function public.sweep_live_viewer_counts() from anon;
revoke execute on function public.sweep_live_viewer_counts() from authenticated;
grant execute on function public.sweep_live_viewer_counts() to service_role;

-- 30초마다 실행(jobname 기준 idempotent — 재실행 시 갱신).
select cron.schedule(
  'sweep-live-viewer-counts',
  '30 seconds',
  $$select public.sweep_live_viewer_counts();$$
);

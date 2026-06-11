-- 라이브 시청자 신선도 윈도 20s → 90s (#97 후속, 유휴 탭 타이머 스로틀링 대응).
-- 크롬은 백그라운드(hidden) 탭의 setInterval을 분당 1회로 스로틀하므로, 20초 윈도에서는
-- 아무 조작 없이 시청만 하는 유휴 시청자의 하트비트가 늦어 sweep마다 카운트에서 탈락→재진입을
-- 반복했다(메인 목록에서 인원이 늘었다 0이 되는 진동). 90s = 스로틀 주기(60s) + 여유(30s)로
-- 늦은 하트비트가 윈도를 벗어나지 않아 진동이 사라진다. 일반 퇴장(언마운트 leave·pagehide beacon)은
-- 즉시 반영이라 영향 없고, 비정상 종료 고스트만 sweep까지 최대 ~2분 잔존한다(수용).
-- sync/recompute/sweep이 공유하는 단일 소스라 이 함수 한 곳만 바꾼다(다른 RPC·cron·인덱스 무변경).
create or replace function public.live_viewer_presence_window()
returns interval
language sql
immutable
set search_path to ''
as $function$
  select interval '90 seconds'
$function$;

revoke execute on function public.live_viewer_presence_window() from public;
revoke execute on function public.live_viewer_presence_window() from anon;
revoke execute on function public.live_viewer_presence_window() from authenticated;
grant execute on function public.live_viewer_presence_window() to service_role;

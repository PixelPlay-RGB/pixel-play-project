-- 코드 감사(2026-06-18): FK 커버링 인덱스 부재(Advisor 0001) 보강.
-- 조인·핫패스(채팅 밴 체크) 성능 + 참조 유저 삭제 시 cascade full-scan 방지.
create index if not exists channel_manager_created_by_idx on public.channel_manager (created_by);
create index if not exists channel_manager_manager_id_idx on public.channel_manager (manager_id);
create index if not exists channel_viewer_ban_banned_by_idx on public.channel_viewer_ban (banned_by);
create index if not exists channel_viewer_ban_banned_user_id_idx on public.channel_viewer_ban (banned_user_id);
create index if not exists channel_viewer_ban_broadcast_id_idx on public.channel_viewer_ban (broadcast_id);
create index if not exists channel_viewer_ban_unbanned_by_idx on public.channel_viewer_ban (unbanned_by);
create index if not exists live_clip_broadcast_id_idx on public.live_clip (broadcast_id);
create index if not exists live_clip_clipper_user_id_idx on public.live_clip (clipper_user_id);
create index if not exists notification_actor_id_idx on public.notification (actor_id);

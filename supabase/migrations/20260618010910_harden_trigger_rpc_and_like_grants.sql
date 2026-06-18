-- 코드 감사(2026-06-18): SECURITY DEFINER 트리거 함수의 RPC 노출 권한과 좋아요 테이블의 죽은 권한을 회수한다.

-- 1) 팔로워 알림/방송종료 브로드캐스트는 AFTER INSERT 트리거 전용 함수다. /rest/v1/rpc로 직접 호출될
--    일이 없는데 anon/authenticated에 EXECUTE가 열려 Advisor 0028/0029가 WARN으로 잡는다. 트리거는
--    EXECUTE 권한과 무관하게 동작하므로 권한 표면만 회수한다(20260516072941 선례와 동일 패턴).
revoke execute on function public.notify_followers_on_community_post() from public, anon, authenticated;
revoke execute on function public.notify_followers_on_live_start() from public, anon, authenticated;
revoke execute on function public.broadcast_live_broadcast_ended() from public, anon, authenticated;

-- 2) community 좋아요 테이블은 RLS enabled + 정책 없음(모든 직접 접근 차단)이고, 실제 좋아요 쓰기는
--    SECURITY DEFINER RPC로만 이뤄진다. anon/authenticated의 테이블 권한은 RLS에 막혀 이미 무력한
--    죽은 권한이다(Advisor 0008). 회수해 표면을 제거한다. SECURITY DEFINER RPC는 소유자 권한으로
--    동작하므로 이 회수의 영향을 받지 않는다.
revoke all on table public.community_comment_like from anon, authenticated;
revoke all on table public.community_post_like from anon, authenticated;

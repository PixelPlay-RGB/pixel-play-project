-- 정산 조회 RPC를 service_role 전용으로 잠급니다.
-- 두 함수는 호출자가 넘긴 p_actor_user_id를 신뢰하므로, 서버(Server Action, createAdminClient)에서만
-- 호출되도록 anon/authenticated/PUBLIC의 EXECUTE 권한을 회수하고 service_role에만 부여합니다.

revoke execute on function public.get_creator_settlement_donations(uuid, integer, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.get_creator_settlement_donations(uuid, integer, text, text, integer, integer) to service_role;

revoke execute on function public.get_creator_settlement_yearly_summary(uuid) from public, anon, authenticated;
grant execute on function public.get_creator_settlement_yearly_summary(uuid) to service_role;

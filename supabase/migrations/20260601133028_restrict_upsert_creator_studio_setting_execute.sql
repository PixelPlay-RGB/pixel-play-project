-- SECURITY DEFINER 쓰기 RPC는 service_role 전용으로 유지 (재생성으로 풀린 PUBLIC/anon/authenticated 권한 회수)
REVOKE EXECUTE ON FUNCTION public.upsert_creator_studio_setting(
  uuid, text, text[], live_chat_scope, integer, boolean, integer, boolean, text[], text,
  boolean, integer, boolean, boolean, integer, boolean, integer, boolean, numeric, jsonb,
  boolean, text, integer, text
) FROM PUBLIC, anon, authenticated;

-- live 동기화 cron 인증 검증용 — Vault의 service_role_key를 Edge Function이 읽어
-- pg_cron이 보낸 Bearer와 비교한다(#111).
-- 함수에 주입되는 SUPABASE_SERVICE_ROLE_KEY와 Vault에 등록한 키의 형식이 달라
-- 환경변수 직접 비교가 실패하는 환경을 흡수한다.
create or replace function public.get_live_sync_cron_secret()
returns text
language sql
stable security definer
set search_path to ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'service_role_key'
  limit 1;
$$;

revoke execute on function public.get_live_sync_cron_secret() from public, anon, authenticated;
grant execute on function public.get_live_sync_cron_secret() to service_role;

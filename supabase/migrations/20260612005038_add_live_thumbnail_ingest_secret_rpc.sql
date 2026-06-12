-- 자동 방송 썸네일 ingest 인증 시크릿을 Vault에서 읽는 RPC — service_role 전용.
-- EC2 캡처 타이머가 Edge Function(ingest-live-thumbnail)으로 프레임을 push할 때
-- X-Capture-Secret 헤더로 보내는 값과 함수가 Vault에서 읽는 값을 대조한다.
create or replace function public.get_live_thumbnail_ingest_secret()
returns text
language sql
stable security definer
set search_path to ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'live_thumbnail_ingest_secret'
  limit 1;
$$;

revoke execute on function public.get_live_thumbnail_ingest_secret() from public, anon, authenticated;
grant execute on function public.get_live_thumbnail_ingest_secret() to service_role;

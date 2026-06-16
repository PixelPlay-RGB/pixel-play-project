-- MediaMTX Control API 인증(Basic) 비밀번호를 Vault에서 읽는 RPC(#111) — service_role 전용.
-- Edge Function(sync-live-broadcast-status)과 송출 상태 라우트(stream-status)가
-- 사용자 pixelplay-api로 Control API를 호출할 때 사용한다.
create or replace function public.get_mediamtx_api_password()
returns text
language sql
stable security definer
set search_path to ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'mediamtx_api_password'
  limit 1;
$$;

revoke execute on function public.get_mediamtx_api_password() from public, anon, authenticated;
grant execute on function public.get_mediamtx_api_password() to service_role;

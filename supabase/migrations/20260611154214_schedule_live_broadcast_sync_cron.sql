-- MediaMTX 송출 상태와 DB 방송 상태를 1분 주기로 동기화한다(#111).
-- Edge Function(sync-live-broadcast-status)이 Control API를 조회해 송출이 끊긴
-- 활성 방송을 end_live_broadcast로 자동 종료한다(방송운영 페이지가 닫혀 있어도 동작).
-- 인증: Vault의 service_role_key를 Bearer로 전달하고 함수가 동일 값인지 비교한다.
-- 선행 조건(미충족 시 401/503으로 안전 실패, 다음 주기 재시도):
--   1. Vault에 service_role_key 등록: select vault.create_secret('<key>', 'service_role_key');
--   2. Edge Function secrets에 LIVE_OVERLAY_TOKEN_SECRET 등록.

select cron.schedule(
  'sync-live-broadcast-status',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://ftvoynnfpfzmblgrntqj.supabase.co/functions/v1/sync-live-broadcast-status',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) as request_id;
  $$
);

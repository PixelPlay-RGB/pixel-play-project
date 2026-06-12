-- 클린봇 LLM 판정 파이프라인(#120) — Edge Function(moderate-live-messages)이 Gemini 배치
-- 판정 결과를 live_message.metadata.cleanbotStatus('flagged'|'clean')로 기록할 때 쓰는 RPC와
-- 20초 주기 cron을 등록한다. 클라이언트는 metadata 플래그를 신호로 메시지를 가린다
-- (기존 클라이언트 시드 사전 필터의 서버 승격 — constants/live/cleanbot.ts 주석의 계획).
-- 인증·선행 조건은 sync-live-broadcast-status와 동일(Vault service_role_key Bearer)이며
-- Edge Function secrets에 GEMINI_API_KEY가 등록되어야 한다(미등록 시 503 안전 실패).

create or replace function public.set_live_message_cleanbot_status(
  p_message_ids uuid[],
  p_status text
)
returns void
language plpgsql
security definer
set search_path to ''
as $func$
begin
  if p_status not in ('flagged', 'clean') then
    raise exception 'invalid cleanbot status: %', p_status;
  end if;

  update public.live_message
  set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('cleanbotStatus', p_status)
  where id = any(p_message_ids);
end;
$func$;

revoke execute on function public.set_live_message_cleanbot_status(uuid[], text) from public, anon, authenticated;
grant execute on function public.set_live_message_cleanbot_status(uuid[], text) to service_role;

-- 주기: 클라 시드 사전이 명백한 욕설을 0초에 가리므로 LLM은 우회·맥락형 2차 백스톱이다.
-- 10초로 둬 백스톱 지연을 짧게 가져간다(무료 티어 RPM 한도 내).
select cron.schedule(
  'moderate-live-messages',
  '10 seconds',
  $$
  select net.http_post(
    url := 'https://ftvoynnfpfzmblgrntqj.supabase.co/functions/v1/moderate-live-messages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) as request_id;
  $$
);

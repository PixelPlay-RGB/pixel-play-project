-- 클립 워커 RPC(#124): EC2 상주 폴러가 Edge Function(clip-worker)을 통해 pending 클립을
-- 원자적으로 클레임한다. 만료된 pending·죽은 워커의 processing 정리도 클레임 시점에 수행해
-- 별도 cron 없이 자가 회복한다.
-- 참고: Vault 시크릿(live_clip_worker_secret) 값 생성은 마이그레이션에 포함하지 않는다
-- (vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), ...)로 별도 1회 실행).

create or replace function public.claim_live_clip_jobs(p_limit integer default 2)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_jobs jsonb;
begin
  -- 60초 HLS 버퍼가 슬라이드해 추출이 불가능해진 요청은 클레임 전에 실패 처리한다.
  -- (최대 30초 클립 + 추출 여유 → 생성 후 25초가 마지노선)
  update public.live_clip
  set status = 'failed'::public.live_clip_status,
      error_reason = 'expired before claim'
  where status = 'pending'::public.live_clip_status
    and created_at < now() - interval '25 seconds';

  -- 워커가 죽어 멈춘 processing은 타임아웃 후 실패 처리한다(버퍼는 이미 지나가 재추출 불가).
  update public.live_clip
  set status = 'failed'::public.live_clip_status,
      error_reason = 'worker timeout'
  where status = 'processing'::public.live_clip_status
    and claimed_at < now() - interval '3 minutes';

  -- pending -> processing 원자 전환. skip locked로 다중 워커가 와도 중복 클레임이 없다.
  with claimed as (
    select clip.id
    from public.live_clip as clip
    where clip.status = 'pending'::public.live_clip_status
    order by clip.created_at
    limit greatest(coalesce(p_limit, 2), 1)
    for update skip locked
  ),
  updated as (
    update public.live_clip as clip
    set status = 'processing'::public.live_clip_status,
        claimed_at = now()
    from claimed
    where clip.id = claimed.id
    returning clip.id, clip.creator_id, clip.created_at, clip.duration_seconds, clip.crop_x_fraction
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'clipId', updated.id,
        'creatorId', updated.creator_id,
        'createdAt', updated.created_at,
        'durationSeconds', updated.duration_seconds,
        'cropXFraction', updated.crop_x_fraction
      )
      order by updated.created_at
    ),
    '[]'::jsonb
  )
  into v_jobs
  from updated;

  return v_jobs;
end;
$function$;

revoke execute on function public.claim_live_clip_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_live_clip_jobs(integer) to service_role;

-- EC2 클립 워커 인증 시크릿을 Vault에서 읽는 RPC — service_role 전용.
-- 워커가 X-Clip-Worker-Secret 헤더로 보내는 값과 함수(clip-worker)가 대조한다.
create or replace function public.get_live_clip_worker_secret()
returns text
language sql
stable security definer
set search_path to ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'live_clip_worker_secret'
  limit 1;
$$;

revoke execute on function public.get_live_clip_worker_secret() from public, anon, authenticated;
grant execute on function public.get_live_clip_worker_secret() to service_role;

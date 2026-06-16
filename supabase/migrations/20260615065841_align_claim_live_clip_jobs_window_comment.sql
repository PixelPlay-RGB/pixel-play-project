-- claim_live_clip_jobs 주석 정합(#124 R6 후속): 윈도우 한계가 40→35초로 좁혀졌으므로
-- (harden_live_clip_window_and_channel_cap) 함수 내 설명 주석의 "now−40초"를 "now−35초"로 맞춘다.
-- 로직(컷오프 15초·반환 필드)은 변화 없음.
create or replace function public.claim_live_clip_jobs(p_limit integer default 2)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_jobs jsonb;
begin
  -- HLS 버퍼가 슬라이드해 추출이 불가능해진 요청은 클레임 전에 실패 처리한다.
  -- (윈도우 시작 최대 now−35초 + 추출 여유 → 생성 후 15초가 마지노선)
  update public.live_clip
  set status = 'failed'::public.live_clip_status,
      error_reason = 'expired before claim'
  where status = 'pending'::public.live_clip_status
    and created_at < now() - interval '15 seconds';

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
    returning clip.id, clip.creator_id, clip.created_at, clip.duration_seconds,
              clip.crop_x_fraction, clip.end_offset_seconds
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'clipId', updated.id,
        'creatorId', updated.creator_id,
        'createdAt', updated.created_at,
        'durationSeconds', updated.duration_seconds,
        'cropXFraction', updated.crop_x_fraction,
        'endOffsetSeconds', updated.end_offset_seconds
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

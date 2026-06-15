-- 라이브 클립 윈도우 오프셋(#124 R5): 시청자가 버퍼 안에서 원하는 15~30초 구간을 앞뒤로
-- 당겨 고를 수 있게 end_offset_seconds(클립 시점=now로부터 "윈도우 끝"까지의 거리, 초)를 추가한다.
-- 안전 추출 한계는 (HLS 버퍼 ≈60초 − 클레임/추출 예약)이라 윈도우 시작은 now−40초까지만 허용하고,
-- 그에 맞춰 클레임 만료 컷오프를 25초→15초로 좁힌다(윈도우 40 + 컷오프 15 + 여유 ≈ 60초 버퍼).
-- end_offset_seconds = 0 은 기존 동작(직전 N초)과 동일하므로, 워커 미배포 구간에도 회귀가 없다.

alter table public.live_clip
  add column end_offset_seconds integer not null default 0
    check (end_offset_seconds >= 0 and end_offset_seconds <= 45);

-- create_live_clip: 윈도우 끝 오프셋 인자 추가. 시그니처가 바뀌므로 기존 5-arg 버전을 드롭한다.
drop function if exists public.create_live_clip(uuid, uuid, text, integer, double precision);

create or replace function public.create_live_clip(
  p_actor_user_id uuid,
  p_creator_id uuid,
  p_title text,
  p_duration_seconds integer,
  p_crop_x_fraction double precision,
  p_end_offset_seconds integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_end_offset integer := coalesce(p_end_offset_seconds, 0);
  v_broadcast record;
  v_last_clip_at timestamp with time zone;
  v_channel_clip_count integer;
  v_clip_id uuid;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_creator_id is null then
    raise sqlstate 'PX400' using message = 'invalid creator';
  end if;

  if p_duration_seconds is null or p_duration_seconds < 15 or p_duration_seconds > 30 then
    raise sqlstate 'PX400' using message = 'invalid clip duration';
  end if;

  if p_crop_x_fraction is null or p_crop_x_fraction < 0 or p_crop_x_fraction > 1 then
    raise sqlstate 'PX400' using message = 'invalid crop position';
  end if;

  -- 윈도우 끝은 0 이상이고, 윈도우 시작(now − (offset+duration))이 안전 추출 한계(now − 40초)를
  -- 넘지 않아야 한다(≈60초 버퍼에서 클레임/추출 예약분을 뺀 값).
  if v_end_offset < 0 or v_end_offset + p_duration_seconds > 40 then
    raise sqlstate 'PX400' using message = 'invalid clip window';
  end if;

  if char_length(v_title) > 100 then
    raise sqlstate 'PX400' using message = 'title too long';
  end if;

  -- 동일 유저 동시 요청 직렬화 — rate limit/상한 체크의 레이스 방지.
  perform pg_advisory_xact_lock(hashtextextended('live_clip:' || p_actor_user_id::text, 0));

  select
    broadcast.id,
    broadcast.title,
    broadcast.started_at
  into v_broadcast
  from public.live_broadcast as broadcast
  where broadcast.creator_id = p_creator_id
    and broadcast.ended_at is null
  order by broadcast.started_at desc
  limit 1;

  if not found then
    raise sqlstate 'PX404' using message = 'active live broadcast not found';
  end if;

  -- 방송 시작 직후에는 윈도우 시작 지점(now − (offset+duration))까지의 영상이 버퍼에 없다.
  if v_broadcast.started_at > now() - make_interval(secs => p_duration_seconds + v_end_offset) then
    raise sqlstate 'PX425' using message = 'broadcast too recent for clip window';
  end if;

  -- 유저당 분당 1개 — 실패(failed)한 클립은 즉시 재시도를 막지 않도록 제외한다.
  select clip.created_at
  into v_last_clip_at
  from public.live_clip as clip
  where clip.clipper_user_id = p_actor_user_id
    and clip.status <> 'failed'::public.live_clip_status
  order by clip.created_at desc
  limit 1;

  if v_last_clip_at is not null
    and v_last_clip_at > now() - interval '60 seconds' then
    raise sqlstate 'PX429' using message = 'clip rate limit';
  end if;

  -- 채널당 보관 상한(30개) — Storage 무료 한도 보호. 도달 시 생성 차단(삭제 없음).
  select count(*)
  into v_channel_clip_count
  from public.live_clip as clip
  where clip.creator_id = p_creator_id
    and clip.status <> 'failed'::public.live_clip_status;

  if v_channel_clip_count >= 30 then
    raise sqlstate 'PX413' using message = 'channel clip limit reached';
  end if;

  -- 빈 제목은 방송 제목으로 폴백(입력칸 기본값과 동일 규칙, 100자 절단).
  if char_length(v_title) = 0 then
    v_title := left(coalesce(v_broadcast.title, '라이브 클립'), 100);
  end if;

  insert into public.live_clip (
    creator_id,
    broadcast_id,
    clipper_user_id,
    title,
    duration_seconds,
    crop_x_fraction,
    end_offset_seconds
  )
  values (
    p_creator_id,
    v_broadcast.id,
    p_actor_user_id,
    v_title,
    p_duration_seconds,
    p_crop_x_fraction,
    v_end_offset
  )
  returning id into v_clip_id;

  return jsonb_build_object('clipId', v_clip_id);
end;
$function$;

revoke execute on function public.create_live_clip(uuid, uuid, text, integer, double precision, integer) from public, anon, authenticated;
grant execute on function public.create_live_clip(uuid, uuid, text, integer, double precision, integer) to service_role;

-- claim_live_clip_jobs: 만료 컷오프 25초→15초(윈도우 시작이 now−40초까지 가능해져 버퍼 여유가 줄었다),
-- 잡 출력에 end_offset_seconds 추가(워커가 윈도우 끝을 알아야 한다).
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
  -- (윈도우 시작 최대 now−40초 + 추출 여유 → 생성 후 15초가 마지노선)
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

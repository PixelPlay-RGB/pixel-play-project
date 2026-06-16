-- 라이브 클립 윈도우·채널 상한 하드닝(#124 R6):
--  ⓐ 추출 버퍼 여유 확보 — 윈도우 시작 한계를 now−40초 → now−35초로 좁힌다(클레임 15초 +
--     ffmpeg 추출 시간을 60초 HLS 버퍼 안에 ~10초 여유로 남긴다).
--  ⓑ 채널당 보관 상한(30) 레이스 봉합 — 서로 다른 시청자의 동시 클립이 카운트 체크를 동시에
--     통과하지 못하도록 채널(creator) 단위 advisory lock을 추가한다(락 순서 actor→channel = 교착 없음).
--  ⓓ end_offset_seconds 컬럼 CHECK(≤45)를 윈도우 예산(35)과 정합되게 ≤35로 조인다.

alter table public.live_clip
  drop constraint if exists live_clip_end_offset_seconds_check;
alter table public.live_clip
  add constraint live_clip_end_offset_seconds_check
    check (end_offset_seconds >= 0 and end_offset_seconds <= 35);

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

  -- 윈도우 끝은 0 이상이고, 윈도우 시작(now − (offset+duration))이 안전 추출 한계(now − 35초)를
  -- 넘지 않아야 한다(≈60초 버퍼 − 클레임 15초 − 추출 여유 ≈ 35초).
  if v_end_offset < 0 or v_end_offset + p_duration_seconds > 35 then
    raise sqlstate 'PX400' using message = 'invalid clip window';
  end if;

  if char_length(v_title) > 100 then
    raise sqlstate 'PX400' using message = 'title too long';
  end if;

  -- 동일 유저 동시 요청 직렬화 — rate limit 체크의 레이스 방지.
  perform pg_advisory_xact_lock(hashtextextended('live_clip:' || p_actor_user_id::text, 0));
  -- 동일 채널 동시 요청 직렬화 — 서로 다른 유저의 동시 클립이 채널 상한(30) 카운트를 동시에
  -- 통과하는 레이스 방지(락 순서는 항상 actor → channel 이라 교착 없음).
  perform pg_advisory_xact_lock(hashtextextended('live_clip_channel:' || p_creator_id::text, 0));

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

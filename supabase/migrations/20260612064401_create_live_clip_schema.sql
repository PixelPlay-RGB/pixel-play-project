-- 라이브 순간 클립(#124): live_clip 테이블 + RLS + realtime + 생성/조회수 RPC.
-- 시청자가 요청한 직전 15~30초를 EC2 워커가 MediaMTX 60초 HLS 버퍼에서 세로(9:16)로
-- 추출한다(녹화·디스크 없음). 행 생성은 RPC 경유만 허용하고, 워커 상태 전이는
-- service_role(Edge Function clip-worker)이 담당한다.

create type public.live_clip_status as enum ('pending', 'processing', 'ready', 'failed');

create table public.live_clip (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public."user"(id) on delete cascade,
  broadcast_id uuid not null references public.live_broadcast(id) on delete cascade,
  clipper_user_id uuid not null references public."user"(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 100),
  duration_seconds integer not null check (duration_seconds between 15 and 30),
  -- 16:9 원본에서 9:16 크롭 박스의 가로 위치(잔여 폭 대비 비율 0~1).
  crop_x_fraction double precision not null check (crop_x_fraction >= 0 and crop_x_fraction <= 1),
  status public.live_clip_status not null default 'pending',
  storage_path text,
  thumbnail_path text,
  -- 실패 원인(워커/만료) — 디버깅용, 클라이언트 비노출.
  error_reason text,
  claimed_at timestamptz,
  view_count integer not null default 0 check (view_count >= 0),
  created_at timestamptz not null default now()
);

-- 워커 클레임 폴링용(pending만 스캔).
create index live_clip_pending_idx
  on public.live_clip (created_at) where status = 'pending';
-- 채널 클립 목록: 최신순 / 인기순(view_count 동률은 최신 우선).
create index live_clip_channel_recent_idx
  on public.live_clip (creator_id, created_at desc) where status = 'ready';
create index live_clip_channel_popular_idx
  on public.live_clip (creator_id, view_count desc, created_at desc) where status = 'ready';

alter table public.live_clip enable row level security;

revoke all on table public.live_clip from public, anon, authenticated;
grant select on table public.live_clip to anon, authenticated;

-- 완성된 클립만 공개(디테일·채널 탭·시청 페이지 섹션은 비로그인도 조회).
create policy "Anyone can read ready live clips"
  on public.live_clip for select to anon, authenticated
  using (status = 'ready');

-- 본인이 만든 클립은 상태 무관 조회 — 생성 직후 Realtime UPDATE(pending→ready/failed)
-- 수신이 이 정책에 의존한다(ready-only 정책만 있으면 완료 알림을 못 받는다).
create policy "Clippers can read own live clips"
  on public.live_clip for select to authenticated
  using (clipper_user_id = (select auth.uid()));

-- 실시간: 생성 완료/실패 전이를 클리퍼에게 즉시 알린다 (중복 add 방지).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'live_clip'
  ) then
    alter publication supabase_realtime add table public.live_clip;
  end if;
end $$;

-- 클립 생성 요청: pending 행만 만든다(추출은 EC2 워커 몫).
-- 반환: jsonb { "clipId": uuid }
create or replace function public.create_live_clip(
  p_actor_user_id uuid,
  p_creator_id uuid,
  p_title text,
  p_duration_seconds integer,
  p_crop_x_fraction double precision
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_title text := btrim(coalesce(p_title, ''));
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

  -- 방송 시작 직후에는 버퍼에 요청 길이만큼의 영상이 없다.
  if v_broadcast.started_at > now() - make_interval(secs => p_duration_seconds) then
    raise sqlstate 'PX425' using message = 'broadcast too recent for clip duration';
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
    crop_x_fraction
  )
  values (
    p_creator_id,
    v_broadcast.id,
    p_actor_user_id,
    v_title,
    p_duration_seconds,
    p_crop_x_fraction
  )
  returning id into v_clip_id;

  return jsonb_build_object('clipId', v_clip_id);
end;
$function$;

revoke execute on function public.create_live_clip(uuid, uuid, text, integer, double precision) from public, anon, authenticated;
grant execute on function public.create_live_clip(uuid, uuid, text, integer, double precision) to service_role;

-- 디테일 페이지 진입 시 단순 증가(서버 액션 경유 — 비로그인 조회도 카운트).
create or replace function public.increment_live_clip_view_count(p_clip_id uuid)
returns void
language sql
security definer
set search_path to ''
as $$
  update public.live_clip
  set view_count = view_count + 1
  where id = p_clip_id
    and status = 'ready'::public.live_clip_status;
$$;

revoke execute on function public.increment_live_clip_view_count(uuid) from public, anon, authenticated;
grant execute on function public.increment_live_clip_view_count(uuid) to service_role;

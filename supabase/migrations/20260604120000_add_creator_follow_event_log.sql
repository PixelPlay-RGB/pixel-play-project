-- 채널 통계 상호작용 로그용 팔로우/언팔로우 이벤트 적재.
-- viewer_creator_relation.followed_at 은 unfollow 시 null 로만 바뀌어 취소 이력이 남지 않는다.
-- followed_at 전이(null<->값)를 트리거로 감지해 follow/unfollow 이벤트를 별도 로그 테이블에 적재한다.
-- (기존 follow_creator/unfollow_creator RPC 는 수정하지 않고 모든 변경 경로를 트리거로 포착)

create table if not exists public.creator_follow_event (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public."user"(id) on delete cascade,
  viewer_id uuid not null references public."user"(id) on delete cascade,
  viewer_nickname text,
  event_type text not null check (event_type in ('follow', 'unfollow')),
  created_at timestamp with time zone not null default now()
);

-- 크리에이터 통계 화면은 본인 creator_id 의 최근 이벤트만 최신순으로 조회한다.
create index if not exists creator_follow_event_creator_created_idx
  on public.creator_follow_event (creator_id, created_at desc);

-- followed_at 전이를 이벤트로 환산한다(닉네임은 realtime payload 자급을 위해 비정규화 저장).
create or replace function public.log_creator_follow_event()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_event_type text;
  v_nickname text;
begin
  if tg_op = 'INSERT' then
    -- 채팅 규칙 동의 등으로 followed_at 없이 생성된 행은 팔로우가 아니다.
    if new.followed_at is null then
      return new;
    end if;
    v_event_type := 'follow';
  else
    -- followed_at 이 실제로 전이된 경우만 이벤트로 본다(채팅 규칙 갱신 등은 무시).
    if new.followed_at is not distinct from old.followed_at then
      return new;
    elsif old.followed_at is null and new.followed_at is not null then
      v_event_type := 'follow';
    elsif old.followed_at is not null and new.followed_at is null then
      v_event_type := 'unfollow';
    else
      -- 값->값(이미 팔로우 중 followed_at 만 갱신)은 새 팔로우가 아니다.
      return new;
    end if;
  end if;

  select target_user.nickname
  into v_nickname
  from public."user" as target_user
  where target_user.id = new.viewer_id;

  insert into public.creator_follow_event (
    creator_id,
    viewer_id,
    viewer_nickname,
    event_type
  )
  values (
    new.creator_id,
    new.viewer_id,
    v_nickname,
    v_event_type
  );

  return new;
end;
$function$;

drop trigger if exists trg_log_creator_follow_event on public.viewer_creator_relation;

create trigger trg_log_creator_follow_event
after insert or update of followed_at on public.viewer_creator_relation
for each row execute function public.log_creator_follow_event();

-- RLS: 크리에이터 본인만 자기 이벤트를 조회한다(쓰기는 security definer 트리거만 수행).
alter table public.creator_follow_event enable row level security;

drop policy if exists creator_follow_event_select_own on public.creator_follow_event;

create policy creator_follow_event_select_own
  on public.creator_follow_event
  for select
  to authenticated
  using (creator_id = (select auth.uid()));

grant select on table public.creator_follow_event to authenticated;

-- 실시간 통계 화면이 폴링 없이 follow/unfollow 를 즉시 받도록 realtime 발행에 추가한다.
alter publication supabase_realtime add table public.creator_follow_event;

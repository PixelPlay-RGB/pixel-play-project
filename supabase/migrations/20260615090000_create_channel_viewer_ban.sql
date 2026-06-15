-- 시청자 강퇴/밴(채널 단위 영구) 이력 테이블(#119).
-- 강퇴는 "역할"이 아니라 사건 이력이다 — 활성 밴 = unbanned_at is null 행, 해제 = UPDATE(삭제 없음),
-- 재강퇴 = 새 행(이력 보존). 밴 스코프는 채널(creator) 단위이고 broadcast_id 는 사건 컨텍스트 기록용이다.
-- 닉네임은 사건 시점 스냅샷으로 비정규화한다 — 해제/이력 조회는 강퇴 당시 표시명을 그대로 보여야 하고,
-- 대상이 닉네임을 바꾸거나 탈퇴(set null)해도 이력이 식별 가능해야 하기 때문이다.

create table if not exists public.channel_viewer_ban (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public."user"(id) on delete cascade,
  banned_user_id uuid not null references public."user"(id) on delete cascade,
  banned_user_nickname text not null,
  banned_by uuid references public."user"(id) on delete set null,
  banned_by_nickname text not null,
  -- 사건 컨텍스트(어느 방송에서 강퇴했는지). 방송이 지워져도 이력은 남아야 해 set null.
  broadcast_id uuid references public.live_broadcast(id) on delete set null,
  banned_at timestamp with time zone not null default now(),
  unbanned_at timestamp with time zone,
  unbanned_by uuid references public."user"(id) on delete set null,
  constraint channel_viewer_ban_no_self check (creator_id <> banned_user_id)
);

-- 활성 밴은 (creator_id, banned_user_id) 당 최대 1행 — 동시 다발 강퇴를 단일 행으로 수렴시킨다.
-- 해제된 과거 행은 unbanned_at 이 채워져 제약에서 빠지므로 재강퇴(새 행)와 공존한다.
create unique index if not exists channel_viewer_ban_active_unique
  on public.channel_viewer_ban (creator_id, banned_user_id)
  where unbanned_at is null;

-- 스튜디오/다이얼로그 이력 목록(creator 기준 최신순) 커버.
create index if not exists channel_viewer_ban_creator_banned_at_idx
  on public.channel_viewer_ban (creator_id, banned_at desc);

alter table public.channel_viewer_ban enable row level security;

-- 크리에이터(채널 주인) 또는 밴 당사자 본인만 조회한다(쓰기는 security definer RPC 전용).
-- 당사자 본인 select 허용은 realtime postgres_changes 가 강퇴/해제를 당사자 브라우저로 전달하기 위한 전제다.
drop policy if exists channel_viewer_ban_select_related on public.channel_viewer_ban;
create policy channel_viewer_ban_select_related
  on public.channel_viewer_ban
  for select
  to authenticated
  using (creator_id = (select auth.uid()) or banned_user_id = (select auth.uid()));

grant select on table public.channel_viewer_ban to authenticated;

-- 해제(UPDATE) 이벤트도 당사자에게 RLS 통과 + 필터 매칭되도록 변경 전후 전체 행을 WAL 에 싣는다.
alter table public.channel_viewer_ban replica identity full;

-- 강퇴/해제를 당사자 브라우저로 즉시 전달하기 위한 realtime publication 등록.
-- 프리뷰 브랜치의 마이그레이션 재replay 시 42710(already member)로 깨지지 않도록 멤버십 존재 가드를 둔다.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'channel_viewer_ban'
  ) then
    alter publication supabase_realtime add table public.channel_viewer_ban;
  end if;
end $$;

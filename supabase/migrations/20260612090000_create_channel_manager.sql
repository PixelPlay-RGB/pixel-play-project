-- 채널 매니저(운영진) 관계 테이블(#118).
-- 매니저는 "역할"이 아니라 채널(creator)↔유저(manager)의 활성 관계다.
-- 이력 보존이 아니라 현재 상태만 필요하므로(해제=관계 삭제) 단일 active 관계 테이블로 둔다.
-- 닉네임은 비정규화하지 않는다 — 활성 관계라 항상 최신 닉네임이 정답이고, 조회 RPC가 user를 조인한다.

create table if not exists public.channel_manager (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public."user"(id) on delete cascade,
  manager_id uuid not null references public."user"(id) on delete cascade,
  created_by uuid references public."user"(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  constraint channel_manager_no_self check (creator_id <> manager_id),
  -- 중복 부여 방지 + (creator_id, manager_id) 프리픽스로 매니저 판정/목록 조회 커버.
  constraint channel_manager_creator_manager_unique unique (creator_id, manager_id)
);

alter table public.channel_manager enable row level security;

-- 크리에이터 본인 또는 매니저 본인만 조회한다(쓰기는 security definer RPC 전용).
drop policy if exists channel_manager_select_related on public.channel_manager;
create policy channel_manager_select_related
  on public.channel_manager
  for select
  to authenticated
  using (creator_id = (select auth.uid()) or manager_id = (select auth.uid()));

grant select on table public.channel_manager to authenticated;

-- 매니저 추가 검색의 닉네임 정확일치(=) 조회용 plain btree.
create index if not exists user_nickname_idx
  on public."user" (nickname);

-- 크리에이터 채널 커뮤니티(게시판) 스키마: 게시글/댓글/좋아요
-- 읽기는 공개(RLS select true), 쓰기는 SECURITY DEFINER RPC + service_role로만 수행합니다.

create table if not exists public.community_post (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public."user"(id) on delete cascade,
  content text not null,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint community_post_content_length check (char_length(btrim(content)) between 1 and 5000)
);
create index if not exists community_post_creator_created_idx
  on public.community_post (creator_id, created_at desc);

create table if not exists public.community_comment (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_post(id) on delete cascade,
  author_id uuid not null references public."user"(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  constraint community_comment_content_length check (char_length(btrim(content)) between 1 and 1000)
);
create index if not exists community_comment_post_created_idx
  on public.community_comment (post_id, created_at desc);

create table if not exists public.community_post_like (
  post_id uuid not null references public.community_post(id) on delete cascade,
  user_id uuid not null references public."user"(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- RLS: 세 테이블 모두 읽기 공개. 쓰기 정책은 두지 않음(RPC/service_role 경유).
alter table public.community_post enable row level security;
alter table public.community_comment enable row level security;
alter table public.community_post_like enable row level security;

create policy "community_post_select_all" on public.community_post
  for select using (true);
create policy "community_comment_select_all" on public.community_comment
  for select using (true);
create policy "community_post_like_select_all" on public.community_post_like
  for select using (true);

-- 댓글 수 동기화 트리거
create or replace function public.sync_community_comment_count()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if tg_op = 'INSERT' then
    update public.community_post
      set comment_count = comment_count + 1
      where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.community_post
      set comment_count = greatest(comment_count - 1, 0)
      where id = old.post_id;
  end if;
  return null;
end;
$function$;

create trigger community_comment_count_trigger
after insert or delete on public.community_comment
for each row execute function public.sync_community_comment_count();

-- 좋아요 수 동기화 트리거
create or replace function public.sync_community_post_like_count()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if tg_op = 'INSERT' then
    update public.community_post
      set like_count = like_count + 1
      where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.community_post
      set like_count = greatest(like_count - 1, 0)
      where id = old.post_id;
  end if;
  return null;
end;
$function$;

create trigger community_post_like_count_trigger
after insert or delete on public.community_post_like
for each row execute function public.sync_community_post_like_count();

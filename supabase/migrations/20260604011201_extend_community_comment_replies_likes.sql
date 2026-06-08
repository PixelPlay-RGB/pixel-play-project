-- 대댓글(1단계) + 댓글 좋아요 지원: parent_id, like_count, community_comment_like 테이블/트리거.

alter table public.community_comment
  add column if not exists parent_id uuid references public.community_comment(id) on delete cascade;
alter table public.community_comment
  add column if not exists like_count integer not null default 0;

-- 상위댓글 정렬(인기/최신/등록)용 + 대댓글 조회용 인덱스
create index if not exists community_comment_post_parent_like_idx
  on public.community_comment (post_id, parent_id, like_count desc, created_at);
create index if not exists community_comment_parent_created_idx
  on public.community_comment (parent_id, created_at);

-- 댓글 좋아요 테이블 (읽기 공개, 쓰기는 RPC/service_role)
create table if not exists public.community_comment_like (
  comment_id uuid not null references public.community_comment(id) on delete cascade,
  user_id uuid not null references public."user"(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.community_comment_like enable row level security;
create policy "community_comment_like_select_all" on public.community_comment_like
  for select using (true);

-- 댓글 좋아요 수 동기화 트리거 (게시글 좋아요 트리거와 동일 구조)
create or replace function public.sync_community_comment_like_count()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if tg_op = 'INSERT' then
    update public.community_comment
      set like_count = like_count + 1
      where id = new.comment_id;
  elsif tg_op = 'DELETE' then
    update public.community_comment
      set like_count = greatest(like_count - 1, 0)
      where id = old.comment_id;
  end if;
  return null;
end;
$function$;

create trigger community_comment_like_count_trigger
after insert or delete on public.community_comment_like
for each row execute function public.sync_community_comment_like_count();

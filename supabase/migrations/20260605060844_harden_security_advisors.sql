-- Supabase advisor 대응(보안 보강 + FK 인덱스).
-- 공개 read RPC와 unused index, like 테이블 RLS는 의도/보류로 그대로 둔다.

-- 1) 트리거 전용 함수가 PostgREST(/rpc)로 직접 호출 가능하던 노출 차단.
--    트리거 실행은 EXECUTE grant와 무관하게 동작하므로 직접 호출만 막히고 부작용 없음.
revoke execute on function public.sync_community_comment_count() from public, anon, authenticated;
revoke execute on function public.sync_community_comment_like_count() from public, anon, authenticated;
revoke execute on function public.sync_community_post_like_count() from public, anon, authenticated;
revoke execute on function public.validate_community_comment_parent() from public, anon, authenticated;
revoke execute on function public.log_creator_follow_event() from public, anon, authenticated;

-- 2) increment_poll_option_count 노출 차단 + search_path 고정(본문은 public.live_poll만 참조 → 안전).
--    이 함수는 대시보드에서 먼저 만들어져 미러 파일(20260606023111)의 타임스탬프가 이 파일보다 늦다.
--    운영 DB에는 이미 적용된 문장이지만, 프리뷰 브랜치는 빈 DB에서 타임스탬프 순으로 재생하므로
--    함수가 아직 없으면 건너뛰도록 가드한다.
--    스킵 시: search_path는 이후 생성 정의(20260606023111·20260606164923)가 내장하지만,
--    revoke는 재적용되지 않아 재생된 DB(프리뷰 한정)에서는 기본 EXECUTE 권한이 남는다.
--    트리거 함수라 직접 호출은 어차피 불가('trigger functions can only be called as triggers')해 수용한 트레이드오프.
do $$
begin
  if to_regprocedure('public.increment_poll_option_count()') is not null then
    revoke execute on function public.increment_poll_option_count() from public, anon, authenticated;
    alter function public.increment_poll_option_count() set search_path = '';
  end if;
end
$$;

-- 3) FK 커버링 인덱스(유저 삭제 cascade·조인 성능).
create index if not exists community_comment_author_id_idx
  on public.community_comment (author_id);
create index if not exists community_comment_like_user_id_idx
  on public.community_comment_like (user_id);
create index if not exists community_post_like_user_id_idx
  on public.community_post_like (user_id);
create index if not exists creator_follow_event_viewer_id_idx
  on public.creator_follow_event (viewer_id);

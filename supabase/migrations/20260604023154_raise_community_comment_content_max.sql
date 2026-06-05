-- 댓글 본문 최대 길이를 1000 → 5000으로 확장(게시글과 동일).
alter table public.community_comment drop constraint community_comment_content_length;
alter table public.community_comment
  add constraint community_comment_content_length
  check (char_length(btrim(content)) between 1 and 5000);

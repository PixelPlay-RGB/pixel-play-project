-- 코드리뷰 반영: 대댓글 parent_id 무결성을 DB 레벨에서 방어적으로 강제.
-- (쓰기 RPC create_community_comment가 이미 평탄화/같은글 검증을 하지만, 향후 다른 경로/실수 대비 defense-in-depth)
-- 규칙: parent_id가 있으면 (1) 부모가 존재하고 (2) 같은 post이며 (3) 부모는 최상위(parent_id is null)여야 한다.

create or replace function public.validate_community_comment_parent()
returns trigger language plpgsql security definer set search_path to ''
as $function$
declare
  v_parent_post_id uuid;
  v_parent_parent_id uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select post_id, parent_id into v_parent_post_id, v_parent_parent_id
  from public.community_comment
  where id = new.parent_id;

  if not found then
    raise sqlstate 'PX404' using message = 'parent comment not found';
  end if;
  if v_parent_post_id <> new.post_id then
    raise sqlstate 'PX422' using message = 'parent comment belongs to a different post';
  end if;
  if v_parent_parent_id is not null then
    raise sqlstate 'PX422' using message = 'replies cannot be nested beyond one level';
  end if;

  return new;
end;
$function$;

drop trigger if exists community_comment_validate_parent_trigger on public.community_comment;
create trigger community_comment_validate_parent_trigger
before insert or update of parent_id on public.community_comment
for each row execute function public.validate_community_comment_parent();

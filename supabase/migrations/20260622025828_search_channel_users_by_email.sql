-- 매니저 검색을 UUID 대신 이메일로 한다(닉네임 정확일치 또는 이메일 정확일치).
-- 이메일은 public.user에 없고 auth.users.email에 있으므로 security definer로 조인한다.
create or replace function public.search_channel_users(p_query text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_email text := lower(btrim(coalesce(p_query, '')));
  v_items jsonb;
begin
  if char_length(v_query) = 0 then
    return jsonb_build_object('items', '[]'::jsonb);
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'userId', matched.id,
        'nickname', matched.nickname,
        'photoUrl', matched.photo_url,
        'email', matched.email
      )
      order by matched.nickname asc
    ),
    '[]'::jsonb
  )
  into v_items
  from (
    select target_user.id, target_user.nickname, target_user.photo_url, au.email
    from public."user" as target_user
    join auth.users as au on au.id = target_user.id
    where target_user.nickname = v_query or lower(au.email) = v_email
    order by target_user.nickname asc
    limit 10
  ) as matched;

  return jsonb_build_object('items', v_items);
end;
$function$;

-- 채널 매니저 권한 관리 RPC 4종(#118).
-- add/remove/search 는 신뢰 파라미터(p_actor_user_id)를 받는 service_role 전용(서버 액션에서만 호출).
-- get 은 auth.uid() 기반 본인 검증이라 authenticated 에 직접 grant(브라우저 TanStack Query).

-- 1) 매니저 추가 — 채널 주인(actor) 본인만. 본인 지정·중복 부여를 거부한다.
--    (활성 밴 유저 지정 거부 가드는 channel_viewer_ban 도입 이슈 #119에서 추가한다.)
create or replace function public.add_channel_manager(p_actor_user_id uuid, p_target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_id uuid;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_target_user_id is null then
    raise sqlstate 'PX400' using message = 'invalid target';
  end if;

  if p_actor_user_id = p_target_user_id then
    raise sqlstate 'PX400' using message = 'cannot grant manager to self';
  end if;

  if not exists (
    select 1 from public."user" as target_user where target_user.id = p_target_user_id
  ) then
    raise sqlstate 'PX404' using message = 'target user not found';
  end if;

  if exists (
    select 1 from public.channel_manager as manager
    where manager.creator_id = p_actor_user_id and manager.manager_id = p_target_user_id
  ) then
    raise sqlstate 'PX409' using message = 'already a manager';
  end if;

  insert into public.channel_manager (creator_id, manager_id, created_by)
  values (p_actor_user_id, p_target_user_id, p_actor_user_id)
  returning id into v_id;

  return jsonb_build_object('managerRelationId', v_id);
end;
$function$;

-- 2) 매니저 해제 — 채널 주인 본인만. 멱등(없는 관계 삭제는 no-op).
create or replace function public.remove_channel_manager(p_actor_user_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  delete from public.channel_manager as manager
  where manager.creator_id = p_actor_user_id and manager.manager_id = p_target_user_id;
end;
$function$;

-- 3) 매니저 목록 — 채널 주인 본인만(auth.uid()=p_creator_id). user 조인으로 최신 닉네임/사진 반환.
create or replace function public.get_channel_managers(p_creator_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
  v_viewer_id uuid := auth.uid();
  v_items jsonb;
begin
  if v_viewer_id is null or v_viewer_id <> p_creator_id then
    raise sqlstate 'PX403' using message = 'forbidden';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'managerRelationId', manager.id,
        'managerId', manager.manager_id,
        'managerNickname', manager_user.nickname,
        'managerPhotoUrl', manager_user.photo_url,
        'createdById', manager.created_by,
        'createdByNickname', creator_user.nickname,
        'createdAt', manager.created_at
      )
      order by manager.created_at desc
    ),
    '[]'::jsonb
  )
  into v_items
  from public.channel_manager as manager
  join public."user" as manager_user on manager_user.id = manager.manager_id
  left join public."user" as creator_user on creator_user.id = manager.created_by
  where manager.creator_id = p_creator_id;

  return jsonb_build_object('items', v_items);
end;
$function$;

-- 4) 유저 검색 — UUID 정확일치 또는 닉네임 정확일치(최대 10). 신뢰 파라미터 없이 동작하지만
--    전 유저 디렉토리 노출을 막으려 부분검색을 의도적으로 배제하고 service_role 전용으로 잠근다.
create or replace function public.search_channel_users(p_query text)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_uuid uuid;
  v_items jsonb;
begin
  if char_length(v_query) = 0 then
    return jsonb_build_object('items', '[]'::jsonb);
  end if;

  begin
    v_uuid := v_query::uuid;
  exception when others then
    v_uuid := null;
  end;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'userId', matched.id,
        'nickname', matched.nickname,
        'photoUrl', matched.photo_url
      )
      order by matched.nickname asc
    ),
    '[]'::jsonb
  )
  into v_items
  from (
    select target_user.id, target_user.nickname, target_user.photo_url
    from public."user" as target_user
    where target_user.nickname = v_query
      or (v_uuid is not null and target_user.id = v_uuid)
    order by target_user.nickname asc
    limit 10
  ) as matched;

  return jsonb_build_object('items', v_items);
end;
$function$;

-- 실행 권한: add/remove/search 는 service_role 전용, get 은 authenticated.
revoke execute on function public.add_channel_manager(uuid, uuid) from public;
revoke execute on function public.add_channel_manager(uuid, uuid) from anon;
revoke execute on function public.add_channel_manager(uuid, uuid) from authenticated;
grant execute on function public.add_channel_manager(uuid, uuid) to service_role;

revoke execute on function public.remove_channel_manager(uuid, uuid) from public;
revoke execute on function public.remove_channel_manager(uuid, uuid) from anon;
revoke execute on function public.remove_channel_manager(uuid, uuid) from authenticated;
grant execute on function public.remove_channel_manager(uuid, uuid) to service_role;

revoke execute on function public.search_channel_users(text) from public;
revoke execute on function public.search_channel_users(text) from anon;
revoke execute on function public.search_channel_users(text) from authenticated;
grant execute on function public.search_channel_users(text) to service_role;

revoke execute on function public.get_channel_managers(uuid) from public;
grant execute on function public.get_channel_managers(uuid) to authenticated;
grant execute on function public.get_channel_managers(uuid) to service_role;

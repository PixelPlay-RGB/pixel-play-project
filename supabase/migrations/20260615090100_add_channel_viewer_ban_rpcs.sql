-- 시청자 강퇴/밴 RPC 4종(#119).
-- ban/unban/get_live_viewer_profile 은 신뢰 파라미터(p_actor_user_id)를 받는 service_role 전용(서버 액션에서만 호출).
--   get_live_viewer_profile 은 닉네임 팝업이 즉시 여는 조회라 authenticated/anon 에 직접 grant(브라우저 TanStack Query).
-- get_channel_viewer_bans 는 auth.uid() 기반 본인(크리에이터/매니저) 검증이라 authenticated 에 직접 grant.

-- 강퇴 주체(actor) 가드: 채널 주인 본인 또는 그 채널의 활성 매니저만.
-- security definer 함수들이 공유하는 검증부라 헬퍼로 추출한다(복붙 금지).
create or replace function public.is_channel_moderator(p_creator_id uuid, p_actor_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select p_creator_id is not null
    and p_actor_user_id is not null
    and (
      p_actor_user_id = p_creator_id
      or exists (
        select 1
        from public.channel_manager as manager
        where manager.creator_id = p_creator_id and manager.manager_id = p_actor_user_id
      )
    );
$function$;

-- 1) 강퇴 — actor(크리에이터/활성 매니저)가 대상 시청자를 채널 단위 영구 밴한다.
--    스트리머·매니저·본인은 강퇴 불가. 활성 밴이 이미 있으면 멱등(기존 행 반환).
create or replace function public.ban_channel_viewer(
  p_actor_user_id uuid,
  p_creator_id uuid,
  p_target_user_id uuid,
  p_broadcast_id uuid default null::uuid
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor_nickname text;
  v_target_nickname text;
  v_ban_id uuid;
  v_existing_id uuid;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_creator_id is null or p_target_user_id is null then
    raise sqlstate 'PX400' using message = 'invalid target';
  end if;

  if p_actor_user_id = p_target_user_id then
    raise sqlstate 'PX400' using message = 'cannot ban self';
  end if;

  if not public.is_channel_moderator(p_creator_id, p_actor_user_id) then
    raise sqlstate 'PX403' using message = 'forbidden';
  end if;

  -- 스트리머 본인은 강퇴 대상이 될 수 없다.
  if p_target_user_id = p_creator_id then
    raise sqlstate 'PX403' using message = 'cannot ban streamer';
  end if;

  -- 매니저는 바로 강퇴할 수 없다(스트리머가 권한 해제 후 강퇴).
  if exists (
    select 1
    from public.channel_manager as manager
    where manager.creator_id = p_creator_id and manager.manager_id = p_target_user_id
  ) then
    raise sqlstate 'PX403' using message = 'cannot ban manager';
  end if;

  select target_user.nickname
  into v_target_nickname
  from public."user" as target_user
  where target_user.id = p_target_user_id;

  if not found then
    raise sqlstate 'PX404' using message = 'target user not found';
  end if;

  select actor_user.nickname
  into v_actor_nickname
  from public."user" as actor_user
  where actor_user.id = p_actor_user_id;

  -- 이미 활성 밴이면 멱등 반환(연속/동시 강퇴를 단일 행으로 수렴).
  select existing.id
  into v_existing_id
  from public.channel_viewer_ban as existing
  where existing.creator_id = p_creator_id
    and existing.banned_user_id = p_target_user_id
    and existing.unbanned_at is null
  limit 1;

  if v_existing_id is not null then
    return jsonb_build_object('banId', v_existing_id, 'alreadyBanned', true);
  end if;

  begin
    insert into public.channel_viewer_ban (
      creator_id,
      banned_user_id,
      banned_user_nickname,
      banned_by,
      banned_by_nickname,
      broadcast_id
    )
    values (
      p_creator_id,
      p_target_user_id,
      v_target_nickname,
      p_actor_user_id,
      coalesce(v_actor_nickname, ''),
      p_broadcast_id
    )
    returning id into v_ban_id;
  exception when unique_violation then
    -- 동시 강퇴가 partial unique 에서 만나면 먼저 들어간 활성 밴으로 수렴한다.
    select existing.id
    into v_ban_id
    from public.channel_viewer_ban as existing
    where existing.creator_id = p_creator_id
      and existing.banned_user_id = p_target_user_id
      and existing.unbanned_at is null
    limit 1;

    return jsonb_build_object('banId', v_ban_id, 'alreadyBanned', true);
  end;

  return jsonb_build_object('banId', v_ban_id, 'alreadyBanned', false);
end;
$function$;

-- 2) 해제 — actor(크리에이터/활성 매니저)가 활성 밴을 해제한다. 멱등(활성 밴 없으면 no-op).
create or replace function public.unban_channel_viewer(
  p_actor_user_id uuid,
  p_creator_id uuid,
  p_target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if not public.is_channel_moderator(p_creator_id, p_actor_user_id) then
    raise sqlstate 'PX403' using message = 'forbidden';
  end if;

  update public.channel_viewer_ban as ban
  set unbanned_at = now(),
      unbanned_by = p_actor_user_id
  where ban.creator_id = p_creator_id
    and ban.banned_user_id = p_target_user_id
    and ban.unbanned_at is null;
end;
$function$;

-- 3) 제재 이력 목록 — 크리에이터/매니저만(auth.uid() 검증). items + totalCount 페이지네이션.
--    닉네임은 사건 시점 스냅샷을 그대로 반환한다(강퇴 당시 표시명 보존).
create or replace function public.get_channel_viewer_bans(
  p_creator_id uuid,
  p_limit integer default 20,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_viewer_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_total integer;
  v_items jsonb;
begin
  if not public.is_channel_moderator(p_creator_id, v_viewer_id) then
    raise sqlstate 'PX403' using message = 'forbidden';
  end if;

  select count(*)::integer
  into v_total
  from public.channel_viewer_ban as ban
  where ban.creator_id = p_creator_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'banId', page.id,
        'bannedUserId', page.banned_user_id,
        'bannedUserNickname', page.banned_user_nickname,
        'bannedById', page.banned_by,
        'bannedByNickname', page.banned_by_nickname,
        'bannedAt', page.banned_at,
        'unbannedAt', page.unbanned_at,
        'isActive', page.unbanned_at is null
      )
      order by page.banned_at desc
    ),
    '[]'::jsonb
  )
  into v_items
  from (
    select ban.*
    from public.channel_viewer_ban as ban
    where ban.creator_id = p_creator_id
    order by ban.banned_at desc
    limit v_limit offset v_offset
  ) as page;

  return jsonb_build_object('items', v_items, 'totalCount', v_total);
end;
$function$;

-- 4) 닉네임 팝업용 시청자 프로필 — 아바타·닉네임·이 채널 팔로우 시작일·현재 역할.
--    강퇴 버튼 가드는 메시지 스냅샷이 아니라 이 "현재 역할"로 판정한다(권한 변동 반영).
create or replace function public.get_live_viewer_profile(
  p_creator_id uuid,
  p_target_user_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_profile jsonb;
begin
  if p_creator_id is null or p_target_user_id is null then
    return 'null'::jsonb;
  end if;

  select jsonb_build_object(
    'userId', target_user.id,
    'nickname', target_user.nickname,
    'photoUrl', target_user.photo_url,
    'followedAt', relation.followed_at,
    'role', case
      when target_user.id = p_creator_id then 'creator'
      when manager.manager_id is not null then 'manager'
      else 'viewer'
    end
  )
  into v_profile
  from public."user" as target_user
  left join public.viewer_creator_relation as relation
    on relation.creator_id = p_creator_id and relation.viewer_id = target_user.id
  left join public.channel_manager as manager
    on manager.creator_id = p_creator_id and manager.manager_id = target_user.id
  where target_user.id = p_target_user_id;

  return coalesce(v_profile, 'null'::jsonb);
end;
$function$;

-- 실행 권한.
revoke execute on function public.is_channel_moderator(uuid, uuid) from public;
revoke execute on function public.is_channel_moderator(uuid, uuid) from anon;
revoke execute on function public.is_channel_moderator(uuid, uuid) from authenticated;
grant execute on function public.is_channel_moderator(uuid, uuid) to service_role;

revoke execute on function public.ban_channel_viewer(uuid, uuid, uuid, uuid) from public;
revoke execute on function public.ban_channel_viewer(uuid, uuid, uuid, uuid) from anon;
revoke execute on function public.ban_channel_viewer(uuid, uuid, uuid, uuid) from authenticated;
grant execute on function public.ban_channel_viewer(uuid, uuid, uuid, uuid) to service_role;

revoke execute on function public.unban_channel_viewer(uuid, uuid, uuid) from public;
revoke execute on function public.unban_channel_viewer(uuid, uuid, uuid) from anon;
revoke execute on function public.unban_channel_viewer(uuid, uuid, uuid) from authenticated;
grant execute on function public.unban_channel_viewer(uuid, uuid, uuid) to service_role;

revoke execute on function public.get_channel_viewer_bans(uuid, integer, integer) from public;
grant execute on function public.get_channel_viewer_bans(uuid, integer, integer) to authenticated;
grant execute on function public.get_channel_viewer_bans(uuid, integer, integer) to service_role;

revoke execute on function public.get_live_viewer_profile(uuid, uuid) from public;
grant execute on function public.get_live_viewer_profile(uuid, uuid) to anon;
grant execute on function public.get_live_viewer_profile(uuid, uuid) to authenticated;
grant execute on function public.get_live_viewer_profile(uuid, uuid) to service_role;

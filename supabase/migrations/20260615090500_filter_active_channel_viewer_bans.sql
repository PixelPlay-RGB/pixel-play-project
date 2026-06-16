-- 시청자 관리 목록을 "활성 강퇴만" 볼 수 있게 get_channel_viewer_bans 에 p_active_only 추가(#119 후속).
-- 해제된 행은 관리 동작이 없어(해제 버튼 없음) 기본 목록에서 제외한다. p_active_only 기본 false 라 전체 조회도 호환.
-- 시그니처(인자) 변경이라 create or replace 로는 교체할 수 없어 3-arg 를 drop 후 4-arg 로 재생성한다.
drop function if exists public.get_channel_viewer_bans(uuid, integer, integer);

create or replace function public.get_channel_viewer_bans(
  p_creator_id uuid,
  p_limit integer default 20,
  p_offset integer default 0,
  p_active_only boolean default false
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
  v_active_only boolean := coalesce(p_active_only, false);
  v_total integer;
  v_items jsonb;
begin
  if not public.is_channel_moderator(p_creator_id, v_viewer_id) then
    raise sqlstate 'PX403' using message = 'forbidden';
  end if;

  select count(*)::integer
  into v_total
  from public.channel_viewer_ban as ban
  where ban.creator_id = p_creator_id
    and (not v_active_only or ban.unbanned_at is null);

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
      and (not v_active_only or ban.unbanned_at is null)
    order by ban.banned_at desc
    limit v_limit offset v_offset
  ) as page;

  return jsonb_build_object('items', v_items, 'totalCount', v_total);
end;
$function$;

revoke execute on function public.get_channel_viewer_bans(uuid, integer, integer, boolean) from public;
grant execute on function public.get_channel_viewer_bans(uuid, integer, integer, boolean) to authenticated;
grant execute on function public.get_channel_viewer_bans(uuid, integer, integer, boolean) to service_role;

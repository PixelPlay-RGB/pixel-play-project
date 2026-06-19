-- GAP-024: get_live_viewer_profile 호출자 검증 추가.
-- 기존엔 anon/authenticated 누구나 임의 (creator, target)로 호출해 followedAt(팔로우 시점)·role(매니저 여부)을
-- enumeration 가능했다. auth.uid() 기반으로 권한별 반환을 분리한다(파라미터·grant·클라 무변경):
--   - 비로그인(anon): nickname/photoUrl만(채팅에 이미 공개되는 정보)
--   - 로그인 시청자: + followedAt (팝오버 "N일부터 팔로우" 표시용)
--   - 크리에이터/매니저: + role (강퇴/매니저 버튼 가드용) → 매니저 역할 enumeration 차단
CREATE OR REPLACE FUNCTION public.get_live_viewer_profile(p_creator_id uuid, p_target_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor uuid := (select auth.uid());
  v_is_operator boolean;
  v_profile jsonb;
begin
  if p_creator_id is null or p_target_user_id is null then
    return 'null'::jsonb;
  end if;

  -- 호출자가 이 채널의 운영자(크리에이터 본인 또는 매니저)인지 — role 노출은 운영자에게만 허용.
  v_is_operator := v_actor is not null and (
    v_actor = p_creator_id
    or exists (
      select 1
      from public.channel_manager as m
      where m.creator_id = p_creator_id and m.manager_id = v_actor
    )
  );

  select jsonb_build_object(
    'userId', target_user.id,
    'nickname', target_user.nickname,
    'photoUrl', target_user.photo_url,
    -- 팔로우 시점은 로그인 호출자에게만(비로그인 enumeration 차단).
    'followedAt', case when v_actor is not null then relation.followed_at else null end,
    -- 역할(매니저 여부)은 운영자에게만(비운영자에겐 null → 클라 canBan/canModerate가 false로 graceful).
    'role', case
      when not v_is_operator then null
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

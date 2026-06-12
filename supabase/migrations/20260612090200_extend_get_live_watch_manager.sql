-- get_live_watch 매니저 확장(#118).
-- 최신본(20260611143709)을 기반으로 두 가지만 additive 로 추가한다.
--   ① viewerRelation.isManager — 시청 화면이 유저관리/매니저 분기를 노출할 수 있게.
--   ② chat_scope='manager' 게이트에서 활성 매니저는 통과시킨다(기존엔 크리에이터만 통과).
-- 사용처 전수 확인 결과 get_live_watch 는 use-live-view-data → live-view + chat-popout(둘 다 시청 화면)뿐이라
-- additive 수정을 적용한다(밴 확장 isBanned/'banned' 는 이슈 #119에서 2차로 추가).
--
-- 보안 가드: 이 함수는 SECURITY DEFINER 이고 anon/authenticated 에 공개돼 있어, p_viewer_id 를 그대로
-- 신뢰하면 임의 호출자가 타인의 UUID 를 넣어 팔로우/매니저 여부·채팅 규칙 동의·채팅 가능 상태를 조회할 수 있다.
-- p_viewer_id 는 호출자 본인(auth.uid())과 일치할 때만 사용하고, 불일치 시 null 로 강등한다(viewer CTE).
-- 정상 호출은 항상 본인 id 를 넘기므로(use-live-view-data: p_viewer_id = user.id) 무영향이고,
-- 비로그인(anon)은 p_viewer_id=null·auth.uid()=null 이라 기존과 동일하다.
-- MVP(20260527121136)부터 이어진 선재 패턴이라, 이 함수를 통째로 재정의하는 본 버전에 가드를 함께 넣는다.
create or replace function public.get_live_watch(p_creator_id uuid, p_viewer_id uuid default null::uuid)
 returns jsonb
 language sql
 stable security definer
 set search_path to ''
as $function$
  with viewer as (
    select case when p_viewer_id = auth.uid() then p_viewer_id else null end as id
  )
  select coalesce(
    (
      select jsonb_build_object(
        'creator', jsonb_build_object(
          'id', creator.id,
          'nickname', creator.nickname,
          'photoUrl', creator.photo_url
        ),
        'broadcast', case
          when broadcast.id is null then 'null'::jsonb
          else jsonb_build_object(
            'id', broadcast.id,
            'title', broadcast.title,
            'tags', broadcast.tags,
            'thumbnailUrl', broadcast.thumbnail_url,
            'startedAt', broadcast.started_at,
            'currentViewerCount', broadcast.current_viewer_count,
            'peakViewerCount', broadcast.peak_viewer_count,
            'chatMessageCount', broadcast.chat_message_count,
            'donationCount', broadcast.donation_count,
            'donationAmountTotal', broadcast.donation_amount_total
          )
        end,
        'settings', jsonb_build_object(
          'chatScope', coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope),
          'followerWaitSeconds', coalesce(setting.follower_wait_seconds, 0),
          'slowModeEnabled', coalesce(setting.slow_mode_enabled, false),
          'slowModeSeconds', coalesce(setting.slow_mode_seconds, 3),
          'linkBlocked', coalesce(setting.link_blocked, true),
          'chatRuleText', coalesce(setting.chat_rule_text, ''),
          'chatRuleVersion', coalesce(setting.chat_rule_version, 1),
          'donationEnabled', coalesce(setting.donation_enabled, true),
          'donationMinAmount', coalesce(setting.donation_min_amount, 1000),
          'donationAmountVisible', coalesce(setting.donation_amount_visible, true)
        ),
        'viewerRelation', case
          when viewer.id is null then 'null'::jsonb
          else jsonb_build_object(
            'isFollowing', relation.followed_at is not null,
            'followedAt', relation.followed_at,
            'chatRuleAcceptedVersion', relation.chat_rule_accepted_version,
            'chatRuleAcceptedAt', relation.chat_rule_accepted_at,
            'isManager', coalesce(manager.is_manager, false)
          )
        end,
        'viewerChatState', case
          when viewer.id is null then jsonb_build_object('canChat', false, 'blockedReason', 'login_required', 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
          when viewer.id = creator.id then jsonb_build_object('canChat', true, 'blockedReason', 'null'::jsonb, 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
          when coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'manager'::public.live_chat_scope and not coalesce(manager.is_manager, false) then jsonb_build_object('canChat', false, 'blockedReason', 'manager_only', 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
          when coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'follower'::public.live_chat_scope and relation.followed_at is null then jsonb_build_object('canChat', false, 'blockedReason', 'follower_required', 'remainingFollowWaitSeconds', coalesce(setting.follower_wait_seconds, 0), 'remainingSlowModeSeconds', 0)
          when coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'follower'::public.live_chat_scope and relation.followed_at > now() - make_interval(secs => coalesce(setting.follower_wait_seconds, 0)) then jsonb_build_object('canChat', false, 'blockedReason', 'follower_wait_required', 'remainingFollowWaitSeconds', greatest(ceil(extract(epoch from relation.followed_at + make_interval(secs => coalesce(setting.follower_wait_seconds, 0)) - now()))::integer, 0), 'remainingSlowModeSeconds', 0)
          when char_length(coalesce(setting.chat_rule_text, '')) > 0 and coalesce(relation.chat_rule_accepted_version, 0) < coalesce(setting.chat_rule_version, 1) then jsonb_build_object('canChat', false, 'blockedReason', 'chat_rule_acceptance_required', 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
          when coalesce(setting.slow_mode_enabled, false) and last_chat.created_at is not null and last_chat.created_at > now() - make_interval(secs => coalesce(setting.slow_mode_seconds, 3)) then jsonb_build_object('canChat', false, 'blockedReason', 'slow_mode_required', 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', greatest(ceil(extract(epoch from last_chat.created_at + make_interval(secs => coalesce(setting.slow_mode_seconds, 3)) - now()))::integer, 0))
          else jsonb_build_object('canChat', true, 'blockedReason', 'null'::jsonb, 'remainingFollowWaitSeconds', 0, 'remainingSlowModeSeconds', 0)
        end
      )
      from viewer
      cross join public."user" as creator
      left join public.creator_studio_setting as setting on setting.creator_id = creator.id
      left join lateral (
        select *
        from public.live_broadcast as active_broadcast
        where active_broadcast.creator_id = creator.id and active_broadcast.ended_at is null
        order by active_broadcast.started_at desc
        limit 1
      ) as broadcast on true
      left join public.viewer_creator_relation as relation on relation.creator_id = creator.id and relation.viewer_id = viewer.id
      left join lateral (
        select exists (
          select 1
          from public.channel_manager as cm
          where cm.creator_id = creator.id and cm.manager_id = viewer.id
        ) as is_manager
      ) as manager on true
      left join lateral (
        select message.created_at
        from public.live_message as message
        where message.creator_id = creator.id and message.sender_id = viewer.id and message.message_type = 'chat'::public.live_message_type
        order by message.created_at desc
        limit 1
      ) as last_chat on true
      where creator.id = p_creator_id
      limit 1
    ),
    'null'::jsonb
  );
$function$;

revoke execute on function public.get_live_watch(uuid, uuid) from public;
grant execute on function public.get_live_watch(uuid, uuid) to anon;
grant execute on function public.get_live_watch(uuid, uuid) to authenticated;
grant execute on function public.get_live_watch(uuid, uuid) to service_role;

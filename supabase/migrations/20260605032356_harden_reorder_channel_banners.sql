-- 채널 관리(#92): reorder_channel_banners 입력 검증 강화.
-- 받은 배열(p_banner_ids)이 본인 배너 "전체 집합"과 정확히 일치(개수=고유=소유=전체)할 때만
-- 순서를 커밋한다. 부분/중복/타인 id가 섞이면 일부 행이 옛 sort_order를 유지해
-- 순서가 어긋날 수 있으므로, 그런 입력은 PX422로 거부한다(desired-state 원칙).
-- 시그니처 불변 → create or replace로 ACL 보존(안전하게 재grant도 수행).

create or replace function public.reorder_channel_banners(
  p_actor_user_id uuid,
  p_banner_ids uuid[]
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_expected_count integer;
  v_received_count integer;
  v_distinct_count integer;
  v_owned_count integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  select count(*) into v_expected_count
  from public.channel_banner
  where creator_id = p_actor_user_id;

  select count(*), count(distinct id)
    into v_received_count, v_distinct_count
  from unnest(coalesce(p_banner_ids, '{}'::uuid[])) as t(id);

  select count(*) into v_owned_count
  from public.channel_banner
  where creator_id = p_actor_user_id and id = any(p_banner_ids);

  -- 개수 일치 + 중복 없음 + 전부 본인 소유 → 본인 배너 전체와 정확히 동일한 집합.
  if v_received_count <> v_expected_count
     or v_received_count <> v_distinct_count
     or v_owned_count <> v_expected_count then
    raise sqlstate 'PX422' using message = 'invalid banner order';
  end if;

  update public.channel_banner b
    set sort_order = o.ord - 1
  from (
    select id, ordinality as ord
    from unnest(p_banner_ids) with ordinality as t(id, ordinality)
  ) o
  where b.id = o.id and b.creator_id = p_actor_user_id;

  return public.get_channel_banners(p_actor_user_id);
end;
$function$;

revoke execute on function public.reorder_channel_banners(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_channel_banners(uuid, uuid[]) to service_role;

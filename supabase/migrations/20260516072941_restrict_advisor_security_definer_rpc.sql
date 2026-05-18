-- Supabase advisor가 지적한 공개 SECURITY DEFINER RPC 실행 권한을 정리한다.

create or replace function public.check_email_exists(target_email text)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
begin
  return exists (
    select 1
    from auth.users as auth_user
    where auth_user.email = target_email
      and auth_user.email_confirmed_at is not null
  );
end;
$function$;

revoke execute on function public.check_email_exists(text) from public;
revoke execute on function public.check_email_exists(text) from anon;
revoke execute on function public.check_email_exists(text) from authenticated;
grant execute on function public.check_email_exists(text) to service_role;

drop function if exists public.check_nickname_exists(text);

create or replace function public.search_chat_rooms(
  p_query text,
  p_limit integer default 8,
  p_section text default null,
  p_offset integer default 0
)
returns table(
  section text,
  id uuid,
  title text,
  description text,
  owner_id uuid,
  owner_nickname text,
  current_member integer,
  max_capacity integer,
  created_at timestamp with time zone,
  has_more boolean
)
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_query text := trim(coalesce(p_query, ''));
  v_owner_query text := regexp_replace(trim(coalesce(p_query, '')), '\s+', '', 'g');
  v_limit integer := least(greatest(coalesce(p_limit, 8), 1), 24);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if v_query = '' then
    return;
  end if;

  if p_section is null or p_section = 'title' then
    return query
    with matched_rooms as (
      select
        count(*) over () as total_count,
        room.id,
        room.title,
        coalesce(room.description, '') as description,
        room.owner_id,
        owner_profile.nickname as owner_nickname,
        room.current_member::integer as current_member,
        room.max_capacity::integer as max_capacity,
        room.created_at
      from public.chat_room as room
      join public."user" as owner_profile on owner_profile.id = room.owner_id
      where room.title ilike '%' || v_query || '%'
      order by room.created_at desc, room.id desc
      limit v_limit
      offset case when p_section = 'title' then v_offset else 0 end
    )
    select
      'title'::text as section,
      matched_rooms.id,
      matched_rooms.title,
      matched_rooms.description,
      matched_rooms.owner_id,
      matched_rooms.owner_nickname,
      matched_rooms.current_member,
      matched_rooms.max_capacity,
      matched_rooms.created_at,
      matched_rooms.total_count > v_offset + v_limit as has_more
    from matched_rooms;
  end if;

  if p_section is null or p_section = 'owner' then
    return query
    with matched_rooms as (
      select
        count(*) over () as total_count,
        room.id,
        room.title,
        coalesce(room.description, '') as description,
        room.owner_id,
        owner_profile.nickname as owner_nickname,
        room.current_member::integer as current_member,
        room.max_capacity::integer as max_capacity,
        room.created_at
      from public.chat_room as room
      join public."user" as owner_profile on owner_profile.id = room.owner_id
      where regexp_replace(owner_profile.nickname, '\s+', '', 'g') ilike '%' || v_owner_query || '%'
      order by room.created_at desc, room.id desc
      limit v_limit
      offset case when p_section = 'owner' then v_offset else 0 end
    )
    select
      'owner'::text as section,
      matched_rooms.id,
      matched_rooms.title,
      matched_rooms.description,
      matched_rooms.owner_id,
      matched_rooms.owner_nickname,
      matched_rooms.current_member,
      matched_rooms.max_capacity,
      matched_rooms.created_at,
      matched_rooms.total_count > v_offset + v_limit as has_more
    from matched_rooms;
  end if;
end;
$function$;

revoke execute on function public.search_chat_rooms(text, integer, text, integer) from public;
revoke execute on function public.search_chat_rooms(text, integer, text, integer) from anon;
grant execute on function public.search_chat_rooms(text, integer, text, integer) to authenticated;

-- Live search RPC for broadcast and creator sections.
-- The shape mirrors search_chat_rooms by using p_section for independent section pagination.

create or replace function public.search_live_results(
  p_query text,
  p_limit integer default 6,
  p_section text default null,
  p_offset integer default 0
)
returns table(
  section text,
  creator_id uuid,
  creator_nickname text,
  creator_photo_url text,
  broadcast_id uuid,
  title text,
  tags text[],
  thumbnail_url text,
  current_viewer_count integer,
  started_at timestamp with time zone,
  is_live boolean,
  follower_count integer,
  has_more boolean
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_normalized_query text := regexp_replace(btrim(coalesce(p_query, '')), '\s+', '', 'g');
  v_limit integer := least(greatest(coalesce(p_limit, 6), 1), 24);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if v_query = '' then
    return;
  end if;

  if p_section is null or p_section = 'broadcast' then
    return query
    with matched_broadcasts as (
      select
        count(*) over () as total_count,
        broadcast.creator_id,
        creator.nickname as creator_nickname,
        creator.photo_url as creator_photo_url,
        broadcast.id as broadcast_id,
        broadcast.title,
        broadcast.tags,
        broadcast.thumbnail_url,
        broadcast.current_viewer_count,
        broadcast.started_at
      from public.live_broadcast as broadcast
      join public."user" as creator
        on creator.id = broadcast.creator_id
      where broadcast.ended_at is null
        and (
          broadcast.title ilike '%' || v_query || '%'
          or regexp_replace(creator.nickname, '\s+', '', 'g') ilike '%' || v_normalized_query || '%'
          or exists (
            select 1
            from unnest(broadcast.tags) as tag
            where tag ilike '%' || v_query || '%'
          )
        )
      order by broadcast.current_viewer_count desc, broadcast.started_at desc, broadcast.id desc
      limit v_limit
      offset case when p_section = 'broadcast' then v_offset else 0 end
    )
    select
      'broadcast'::text,
      matched_broadcasts.creator_id,
      matched_broadcasts.creator_nickname,
      matched_broadcasts.creator_photo_url,
      matched_broadcasts.broadcast_id,
      matched_broadcasts.title,
      matched_broadcasts.tags,
      matched_broadcasts.thumbnail_url,
      matched_broadcasts.current_viewer_count,
      matched_broadcasts.started_at,
      true,
      (
        select count(*)::integer
        from public.viewer_creator_relation as relation
        where relation.creator_id = matched_broadcasts.creator_id
          and relation.followed_at is not null
      ),
      matched_broadcasts.total_count > v_offset + v_limit
    from matched_broadcasts;
  end if;

  if p_section is null or p_section = 'creator' then
    return query
    with creators as (
      select
        creator.id as creator_id,
        creator.nickname as creator_nickname,
        creator.photo_url as creator_photo_url
      from public."user" as creator
      where regexp_replace(creator.nickname, '\s+', '', 'g') ilike '%' || v_normalized_query || '%'
    ),
    creator_rows as (
      select
        creators.creator_id,
        creators.creator_nickname,
        creators.creator_photo_url,
        broadcast.id as broadcast_id,
        broadcast.title,
        broadcast.tags,
        broadcast.thumbnail_url,
        coalesce(broadcast.current_viewer_count, 0)::integer as current_viewer_count,
        broadcast.started_at,
        (broadcast.id is not null) as is_live,
        (
          select count(*)::integer
          from public.viewer_creator_relation as relation
          where relation.creator_id = creators.creator_id
            and relation.followed_at is not null
        ) as follower_count
      from creators
      left join lateral (
        select active_broadcast.*
        from public.live_broadcast as active_broadcast
        where active_broadcast.creator_id = creators.creator_id
          and active_broadcast.ended_at is null
        order by active_broadcast.current_viewer_count desc, active_broadcast.started_at desc
        limit 1
      ) as broadcast on true
    ),
    ranked_creators as (
      select
        count(*) over () as total_count,
        creator_rows.*
      from creator_rows
      order by creator_rows.is_live desc, creator_rows.current_viewer_count desc, creator_rows.creator_nickname asc
      limit v_limit
      offset case when p_section = 'creator' then v_offset else 0 end
    )
    select
      'creator'::text,
      ranked_creators.creator_id,
      ranked_creators.creator_nickname,
      ranked_creators.creator_photo_url,
      ranked_creators.broadcast_id,
      ranked_creators.title,
      coalesce(ranked_creators.tags, '{}'::text[]),
      ranked_creators.thumbnail_url,
      ranked_creators.current_viewer_count,
      ranked_creators.started_at,
      ranked_creators.is_live,
      ranked_creators.follower_count,
      ranked_creators.total_count > v_offset + v_limit
    from ranked_creators;
  end if;
end;
$function$;

revoke execute on function public.search_live_results(text, integer, text, integer) from public;
grant execute on function public.search_live_results(text, integer, text, integer) to anon;
grant execute on function public.search_live_results(text, integer, text, integer) to authenticated;
grant execute on function public.search_live_results(text, integer, text, integer) to service_role;

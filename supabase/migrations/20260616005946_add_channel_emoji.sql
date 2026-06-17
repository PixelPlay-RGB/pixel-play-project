-- 채널 이모지(구독티콘, #127): 테이블 + CRUD RPC.
-- 크리에이터가 구독자용 이모지를 등록·관리. 이미지는 통합 user-media 버킷, 행 메타데이터는 admin RPC.
-- 사용(채팅 노출)·구독자 게이팅은 범위 밖(팀원 구독 작업). GIF·티어 없음(PNG·플랫, 채널당 ≤10).

create table if not exists public.channel_emoji (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public."user"(id) on delete cascade,
  image_path text not null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint channel_emoji_name_length check (char_length(name) between 1 and 20)
);
create index if not exists channel_emoji_creator_sort_idx on public.channel_emoji (creator_id, sort_order);

alter table public.channel_emoji enable row level security;
drop policy if exists "channel_emoji_select_all" on public.channel_emoji;
create policy "channel_emoji_select_all" on public.channel_emoji for select using (true);

-- 목록 jsonb(image_path 반환; public URL은 서버에서 변환). insert/update/delete/reorder 반환에도 재사용.
create or replace function public.get_channel_emojis(p_creator_id uuid)
returns jsonb language sql stable security definer set search_path to ''
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'imagePath', e.image_path,
    'name', e.name,
    'sortOrder', e.sort_order
  ) order by e.sort_order asc, e.created_at asc), '[]'::jsonb)
  from public.channel_emoji e
  where e.creator_id = p_creator_id;
$function$;

-- 추가: 동시 추가 경합 방지(advisory lock) + 최대 10개 가드 + sort_order=max+1
create or replace function public.insert_channel_emoji(
  p_actor_user_id uuid,
  p_image_path text,
  p_name text
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_count integer;
  v_name text;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;
  v_name := btrim(coalesce(p_name, ''));
  if v_name = '' or char_length(v_name) > 20 or coalesce(btrim(p_image_path), '') = '' then
    raise sqlstate 'PX422' using message = 'invalid emoji';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_actor_user_id::text, 0));

  select count(*) into v_count from public.channel_emoji where creator_id = p_actor_user_id;
  if v_count >= 10 then
    raise sqlstate 'PX409' using message = 'emoji limit reached';
  end if;

  insert into public.channel_emoji (creator_id, image_path, name, sort_order)
  values (
    p_actor_user_id,
    btrim(p_image_path),
    v_name,
    coalesce((select max(sort_order) + 1 from public.channel_emoji where creator_id = p_actor_user_id), 0)
  );

  return public.get_channel_emojis(p_actor_user_id);
end;
$function$;

-- 수정: 본인 행만. 이름 변경 + (옵션) 이미지 교체. 교체 시 옛 image_path를 반환해 액션이 스토리지 정리.
create or replace function public.update_channel_emoji(
  p_actor_user_id uuid,
  p_emoji_id uuid,
  p_name text,
  p_image_path text default null
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_name text;
  v_old_image_path text;
  v_new_image_path text;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;
  v_name := btrim(coalesce(p_name, ''));
  if v_name = '' or char_length(v_name) > 20 then
    raise sqlstate 'PX422' using message = 'invalid emoji';
  end if;

  select image_path into v_old_image_path
  from public.channel_emoji
  where id = p_emoji_id and creator_id = p_actor_user_id;

  if v_old_image_path is null then
    raise sqlstate 'PX404' using message = 'emoji not found';
  end if;

  -- 새 이미지 경로가 오면 교체(옛 경로는 액션이 정리), 없으면 이름만 변경.
  v_new_image_path := nullif(btrim(coalesce(p_image_path, '')), '');

  update public.channel_emoji
    set name = v_name,
        image_path = coalesce(v_new_image_path, image_path)
  where id = p_emoji_id and creator_id = p_actor_user_id;

  return jsonb_build_object(
    'oldImagePath', case when v_new_image_path is not null then v_old_image_path else null end,
    'emojis', public.get_channel_emojis(p_actor_user_id)
  );
end;
$function$;

-- 삭제: 본인 행만. image_path를 함께 반환해 액션이 스토리지 객체 정리.
create or replace function public.delete_channel_emoji(
  p_actor_user_id uuid,
  p_emoji_id uuid
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_image_path text;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  delete from public.channel_emoji
  where id = p_emoji_id and creator_id = p_actor_user_id
  returning image_path into v_image_path;

  if v_image_path is null then
    raise sqlstate 'PX404' using message = 'emoji not found';
  end if;

  return jsonb_build_object(
    'imagePath', v_image_path,
    'emojis', public.get_channel_emojis(p_actor_user_id)
  );
end;
$function$;

-- 순서 재정렬: 받은 배열이 본인 전체 집합과 정확히 일치(개수=고유=소유=전체)할 때만 커밋(desired-state).
create or replace function public.reorder_channel_emojis(
  p_actor_user_id uuid,
  p_emoji_ids uuid[]
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
  from public.channel_emoji where creator_id = p_actor_user_id;

  select count(*), count(distinct id)
    into v_received_count, v_distinct_count
  from unnest(coalesce(p_emoji_ids, '{}'::uuid[])) as t(id);

  select count(*) into v_owned_count
  from public.channel_emoji
  where creator_id = p_actor_user_id and id = any(p_emoji_ids);

  if v_received_count <> v_expected_count
     or v_received_count <> v_distinct_count
     or v_owned_count <> v_expected_count then
    raise sqlstate 'PX422' using message = 'invalid emoji order';
  end if;

  update public.channel_emoji e
    set sort_order = o.ord - 1
  from (
    select id, ordinality as ord
    from unnest(p_emoji_ids) with ordinality as t(id, ordinality)
  ) o
  where e.id = o.id and e.creator_id = p_actor_user_id;

  return public.get_channel_emojis(p_actor_user_id);
end;
$function$;

revoke execute on function public.get_channel_emojis(uuid) from public, anon, authenticated;
revoke execute on function public.insert_channel_emoji(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.update_channel_emoji(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.delete_channel_emoji(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.reorder_channel_emojis(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.get_channel_emojis(uuid) to service_role;
grant execute on function public.insert_channel_emoji(uuid, text, text) to service_role;
grant execute on function public.update_channel_emoji(uuid, uuid, text, text) to service_role;
grant execute on function public.delete_channel_emoji(uuid, uuid) to service_role;
grant execute on function public.reorder_channel_emojis(uuid, uuid[]) to service_role;

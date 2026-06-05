-- 채널 관리(#92): 배너 테이블 + 배너 CRUD RPC.
-- 배너 이미지 스토리지는 통합 user-media 버킷을 사용한다(20260605_create_user_media_bucket).

create table if not exists public.channel_banner (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public."user"(id) on delete cascade,
  image_path text not null,
  title text not null default '',
  link_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint channel_banner_title_length check (char_length(title) <= 20),
  constraint channel_banner_link_length check (char_length(link_url) between 1 and 100)
);
create index if not exists channel_banner_creator_sort_idx on public.channel_banner (creator_id, sort_order);

alter table public.channel_banner enable row level security;
drop policy if exists "channel_banner_select_all" on public.channel_banner;
create policy "channel_banner_select_all" on public.channel_banner for select using (true);

-- 배너 목록 jsonb (image_path 반환; public URL은 서버에서 변환). insert/delete/reorder 반환에도 재사용.
create or replace function public.get_channel_banners(p_creator_id uuid)
returns jsonb language sql stable security definer set search_path to ''
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'imagePath', b.image_path,
    'title', b.title,
    'linkUrl', b.link_url,
    'sortOrder', b.sort_order
  ) order by b.sort_order asc, b.created_at asc), '[]'::jsonb)
  from public.channel_banner b
  where b.creator_id = p_creator_id;
$function$;

-- 배너 추가: 동시 추가 경합 방지(advisory lock) + 최대 5개 가드 + sort_order=max+1
create or replace function public.insert_channel_banner(
  p_actor_user_id uuid,
  p_image_path text,
  p_title text,
  p_link_url text
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_count integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;
  if coalesce(btrim(p_image_path), '') = '' or coalesce(btrim(p_link_url), '') = '' then
    raise sqlstate 'PX422' using message = 'invalid banner';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_actor_user_id::text, 0));

  select count(*) into v_count from public.channel_banner where creator_id = p_actor_user_id;
  if v_count >= 5 then
    raise sqlstate 'PX409' using message = 'banner limit reached';
  end if;

  insert into public.channel_banner (creator_id, image_path, title, link_url, sort_order)
  values (
    p_actor_user_id,
    btrim(p_image_path),
    coalesce(btrim(p_title), ''),
    btrim(p_link_url),
    coalesce((select max(sort_order) + 1 from public.channel_banner where creator_id = p_actor_user_id), 0)
  );

  return public.get_channel_banners(p_actor_user_id);
end;
$function$;

-- 배너 삭제: 본인 행만. image_path를 함께 반환해 액션이 스토리지 객체 정리.
create or replace function public.delete_channel_banner(
  p_actor_user_id uuid,
  p_banner_id uuid
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare
  v_image_path text;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  delete from public.channel_banner
  where id = p_banner_id and creator_id = p_actor_user_id
  returning image_path into v_image_path;

  if v_image_path is null then
    raise sqlstate 'PX404' using message = 'banner not found';
  end if;

  return jsonb_build_object(
    'imagePath', v_image_path,
    'banners', public.get_channel_banners(p_actor_user_id)
  );
end;
$function$;

-- 배너 순서 재정렬: 받은 순서대로 sort_order 일괄(본인 것만, 단일 원자 update).
create or replace function public.reorder_channel_banners(
  p_actor_user_id uuid,
  p_banner_ids uuid[]
)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
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

revoke execute on function public.get_channel_banners(uuid) from public, anon, authenticated;
revoke execute on function public.insert_channel_banner(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.delete_channel_banner(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.reorder_channel_banners(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.get_channel_banners(uuid) to service_role;
grant execute on function public.insert_channel_banner(uuid, text, text, text) to service_role;
grant execute on function public.delete_channel_banner(uuid, uuid) to service_role;
grant execute on function public.reorder_channel_banners(uuid, uuid[]) to service_role;

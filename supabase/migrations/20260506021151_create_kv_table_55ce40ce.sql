-- Baseline migration reconstructed from the actual Supabase project schema.
-- Project ref: ftvoynnfpfzmblgrntqj

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_net" with schema extensions;

create schema if not exists private;

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'gender') then
    create type public.gender as enum ('male', 'female', 'none');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'oauth_provider') then
    create type public.oauth_provider as enum ('google', 'github', 'email');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'message_type') then
    create type public.message_type as enum ('text', 'system');
  end if;
end;
$$;

create table if not exists public."user" (
  id uuid primary key,
  email text not null,
  name text not null,
  birth text not null,
  phone text not null,
  gender public.gender not null,
  created_at timestamp with time zone not null default now(),
  modified_at timestamp with time zone not null default now(),
  nickname text not null,
  linked_providers public.oauth_provider[] not null default '{}'::public.oauth_provider[],
  photo_url text,
  constraint user_nickname_unique unique (nickname)
);

create table if not exists public.chat_room (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  description text,
  max_capacity smallint not null,
  created_at timestamp with time zone not null default now(),
  modified_at timestamp with time zone not null default now(),
  current_member integer not null default 0,
  constraint chat_room_current_member_non_negative check (current_member >= 0),
  constraint chat_room_owner_id_fkey foreign key (owner_id) references public."user"(id) on delete cascade
);

create table if not exists public.chat_room_member (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  chat_room_id uuid not null,
  last_joined_at timestamp with time zone default now(),
  last_read_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  is_banned boolean not null default false,
  constraint chat_room_member_chat_room_id_fkey foreign key (chat_room_id) references public.chat_room(id) on delete cascade,
  constraint chat_room_member_user_id_fkey foreign key (user_id) references public."user"(id) on delete cascade,
  constraint chat_room_member_chat_room_id_user_id_key unique (chat_room_id, user_id)
);

create table if not exists public.message (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  chat_room_id uuid not null,
  content text not null,
  created_at timestamp with time zone not null default now(),
  modified_at timestamp with time zone not null default now(),
  message_type public.message_type not null default 'text'::public.message_type,
  constraint message_chat_room_id_fkey foreign key (chat_room_id) references public.chat_room(id) on delete cascade,
  constraint message_user_id_fkey foreign key (user_id) references public."user"(id) on delete cascade
);

create index if not exists chat_room_member_user_id_idx on public.chat_room_member using btree (user_id);
create index if not exists message_chat_room_id_idx on public.message using btree (chat_room_id);
create index if not exists message_chat_room_id_created_at_idx on public.message using btree (chat_room_id, created_at desc);
create index if not exists message_user_id_idx on public.message using btree (user_id);

alter table public."user" enable row level security;
alter table public.chat_room enable row level security;
alter table public.chat_room_member enable row level security;
alter table public.message enable row level security;

create or replace function public.update_modified_column()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  new.modified_at = now();
  return new;
end;
$function$;

create or replace function public.update_member_count()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if tg_op = 'INSERT' then
    if new.is_banned = false and new.last_joined_at is not null then
      update public.chat_room
      set current_member = current_member + 1
      where id = new.chat_room_id;
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.is_banned = false and old.last_joined_at is not null then
      update public.chat_room
      set current_member = greatest(current_member - 1, 0)
      where id = old.chat_room_id;
    end if;

    return old;
  end if;

  if tg_op = 'UPDATE' then
    if old.chat_room_id <> new.chat_room_id then
      if old.is_banned = false and old.last_joined_at is not null then
        update public.chat_room
        set current_member = greatest(current_member - 1, 0)
        where id = old.chat_room_id;
      end if;

      if new.is_banned = false and new.last_joined_at is not null then
        update public.chat_room
        set current_member = current_member + 1
        where id = new.chat_room_id;
      end if;
    elsif (old.is_banned = false and old.last_joined_at is not null)
      and (new.is_banned = true or new.last_joined_at is null) then
      update public.chat_room
      set current_member = greatest(current_member - 1, 0)
      where id = old.chat_room_id;
    elsif (old.is_banned = true or old.last_joined_at is null)
      and (new.is_banned = false and new.last_joined_at is not null) then
      update public.chat_room
      set current_member = current_member + 1
      where id = new.chat_room_id;
    end if;

    return new;
  end if;

  return null;
end;
$function$;

create or replace function public.delete_empty_chat_room()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.current_member = 0
    and old.current_member is distinct from new.current_member then
    delete from public.chat_room
    where id = new.id
      and current_member = 0;
  end if;

  return new;
end;
$function$;

create or replace function public.delete_user_storage_on_delete()
returns trigger
language plpgsql
set search_path to 'public', 'storage'
as $function$
declare
  anon_key text := current_setting('app.settings.supabase_anon_key', true);
  functions_url text := current_setting('app.settings.supabase_functions_url', true);
begin
  if functions_url is null or functions_url = '' then
    return old;
  end if;

  perform net.http_post(
    url := functions_url || '/delete-user-storage',
    body := json_build_object(
      'old_record',
      json_build_object('id', old.id)
    )::jsonb,
    headers := jsonb_strip_nulls(json_build_object(
      'Content-Type', 'application/json',
      'Authorization', case when anon_key is null or anon_key = '' then null else 'Bearer ' || anon_key end
    )::jsonb)
  );

  return old;
end;
$function$;

create or replace function private.delete_public_user_on_auth_delete()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  delete from public."user"
  where id = old.id;

  return old;
end;
$function$;

create or replace function public.notify_delete_user_storage()
returns trigger
language plpgsql
security definer
set search_path to 'net', 'extensions', 'public'
as $function$
declare
  anon_key text := current_setting('app.settings.supabase_anon_key', true);
  functions_url text := current_setting('app.settings.supabase_functions_url', true);
begin
  if functions_url is null or functions_url = '' then
    return old;
  end if;

  perform net.http_post(
    url := functions_url || '/delete-user-storage',
    body := json_build_object('old_record', json_build_object('id', old.id))::jsonb,
    headers := jsonb_strip_nulls(json_build_object(
      'Content-Type', 'application/json',
      'Authorization', case when anon_key is null or anon_key = '' then null else 'Bearer ' || anon_key end
    )::jsonb)
  );

  return old;
end;
$function$;

create or replace function public.insert_chat_room_member_system_message()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  target_nickname text;
  actor_id uuid := auth.uid();
begin
  select u.nickname into target_nickname
  from public."user" u
  where u.id = coalesce(new.user_id, old.user_id);

  if tg_op = 'INSERT' then
    if new.is_banned = false and new.last_joined_at is not null then
      insert into public.message (chat_room_id, user_id, content, message_type)
      values (
        new.chat_room_id,
        coalesce(actor_id, new.user_id),
        coalesce(target_nickname, substring(new.user_id::text, 1, 8)) || '님이 입장했습니다.',
        'system'
      );
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (old.is_banned = true or old.last_joined_at is null)
      and (new.is_banned = false and new.last_joined_at is not null) then
      insert into public.message (chat_room_id, user_id, content, message_type)
      values (
        new.chat_room_id,
        coalesce(actor_id, new.user_id),
        coalesce(target_nickname, substring(new.user_id::text, 1, 8)) || '님이 입장했습니다.',
        'system'
      );
    elsif old.is_banned = false and new.is_banned = true then
      insert into public.message (chat_room_id, user_id, content, message_type)
      values (
        new.chat_room_id,
        coalesce(actor_id, new.user_id),
        coalesce(target_nickname, substring(new.user_id::text, 1, 8)) || '님을 내보냈습니다.',
        'system'
      );
    elsif (old.is_banned = false and old.last_joined_at is not null)
      and (new.is_banned = false and new.last_joined_at is null) then
      insert into public.message (chat_room_id, user_id, content, message_type)
      values (
        new.chat_room_id,
        coalesce(actor_id, new.user_id),
        coalesce(target_nickname, substring(new.user_id::text, 1, 8)) || '님이 퇴장했습니다.',
        'system'
      );
    end if;

    return new;
  end if;

  return null;
end;
$function$;

create or replace function public.check_email_exists(target_email text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return exists (
    select 1
    from auth.users
    where email = target_email
      and email_confirmed_at is not null
  );
end;
$function$;

create or replace function public.check_nickname_exists(target_nickname text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return exists (
    select 1
    from public."user"
    where nickname = target_nickname
  );
end;
$function$;

create or replace function public.get_room_counts_by_user(p_user_id uuid)
returns table(joined bigint, not_joined bigint, owned bigint)
language plpgsql
stable
set search_path to 'public'
as $function$
begin
  return query
  select
    (
      select count(*)
      from public.chat_room as room
      join public.chat_room_member as member on member.chat_room_id = room.id
      where member.user_id = p_user_id
        and member.is_banned = false
        and member.last_joined_at is not null
    ) as joined,
    (
      select count(*)
      from public.chat_room as room
      left join public.chat_room_member as member
        on member.chat_room_id = room.id
       and member.user_id = p_user_id
      where room.owner_id <> p_user_id
        and (
          member.user_id is null
          or (member.is_banned = false and member.last_joined_at is null)
        )
    ) as not_joined,
    (
      select count(*)
      from public.chat_room
      where owner_id = p_user_id
    ) as owned;
end;
$function$;

create or replace function public.get_rooms_by_tab(
  p_user_id uuid,
  p_tab_type text,
  p_sort_option text default 'CREATED_AT_DESC'
)
returns table(
  id uuid,
  title text,
  description text,
  max_capacity integer,
  current_member integer,
  owner_id uuid,
  owner_nickname text,
  created_at timestamp with time zone
)
language plpgsql
stable
set search_path to 'public'
as $function$
declare
  v_tab_type text := upper(coalesce(p_tab_type, ''));
  v_sort_option text := upper(coalesce(p_sort_option, 'CREATED_AT_DESC'));
begin
  if v_sort_option not in ('CREATED_AT_DESC', 'LAST_MESSAGE_DESC', 'CURRENT_MEMBER_DESC') then
    v_sort_option := 'CREATED_AT_DESC';
  end if;

  if v_tab_type = 'NOT_JOINED' and v_sort_option = 'LAST_MESSAGE_DESC' then
    v_sort_option := 'CREATED_AT_DESC';
  end if;

  if v_tab_type = 'OWNED' then
    return query
    select room.id, room.title, room.description, room.max_capacity::integer,
      room.current_member, room.owner_id, owner.nickname, room.created_at
    from public.chat_room as room
    join public."user" as owner on owner.id = room.owner_id
    left join lateral (
      select max(message.created_at) as last_message_at
      from public.message as message
      where message.chat_room_id = room.id
    ) as latest_message on true
    where room.owner_id = p_user_id
    order by
      case when v_sort_option = 'LAST_MESSAGE_DESC' then coalesce(latest_message.last_message_at, room.created_at) end desc nulls last,
      case when v_sort_option = 'CURRENT_MEMBER_DESC' then room.current_member end desc nulls last,
      room.created_at desc,
      room.id desc;
  elsif v_tab_type = 'JOINED' then
    return query
    select room.id, room.title, room.description, room.max_capacity::integer,
      room.current_member, room.owner_id, owner.nickname, room.created_at
    from public.chat_room as room
    join public."user" as owner on owner.id = room.owner_id
    join public.chat_room_member as member on member.chat_room_id = room.id
    left join lateral (
      select max(message.created_at) as last_message_at
      from public.message as message
      where message.chat_room_id = room.id
    ) as latest_message on true
    where member.user_id = p_user_id
      and member.is_banned = false
      and member.last_joined_at is not null
    order by
      case when v_sort_option = 'LAST_MESSAGE_DESC' then coalesce(latest_message.last_message_at, room.created_at) end desc nulls last,
      case when v_sort_option = 'CURRENT_MEMBER_DESC' then room.current_member end desc nulls last,
      room.created_at desc,
      room.id desc;
  elsif v_tab_type = 'NOT_JOINED' then
    return query
    select room.id, room.title, room.description, room.max_capacity::integer,
      room.current_member, room.owner_id, owner.nickname, room.created_at
    from public.chat_room as room
    join public."user" as owner on owner.id = room.owner_id
    left join public.chat_room_member as member
      on member.chat_room_id = room.id
     and member.user_id = p_user_id
    where room.owner_id <> p_user_id
      and (
        member.user_id is null
        or (member.is_banned = false and member.last_joined_at is null)
      )
    order by
      case when v_sort_option = 'CURRENT_MEMBER_DESC' then room.current_member end desc nulls last,
      room.created_at desc,
      room.id desc;
  end if;
end;
$function$;

create or replace function public.get_rooms_by_tab_count(p_user_id uuid, p_tab_type text)
returns table(
  id uuid,
  title text,
  description text,
  max_capacity integer,
  current_member integer,
  owner_id uuid,
  owner_nickname text,
  created_at timestamp with time zone,
  unread_count integer
)
language plpgsql
stable
set search_path to 'public'
as $function$
begin
  if upper(p_tab_type) = 'OWNED' then
    return query
    select room.id, room.title, room.description, room.max_capacity::integer,
      room.current_member, room.owner_id, owner.nickname, room.created_at,
      coalesce((
        select count(*)::integer
        from public.message m
        where m.chat_room_id = room.id
          and m.created_at > coalesce(crm_read.last_read_at, 'epoch'::timestamptz)
          and m.user_id <> p_user_id
      ), 0) as unread_count
    from public.chat_room as room
    join public."user" as owner on owner.id = room.owner_id
    left join public.chat_room_member as crm_read
      on crm_read.chat_room_id = room.id
     and crm_read.user_id = p_user_id
    where room.owner_id = p_user_id
    order by room.created_at desc;
  elsif upper(p_tab_type) = 'JOINED' then
    return query
    select room.id, room.title, room.description, room.max_capacity::integer,
      room.current_member, room.owner_id, owner.nickname, room.created_at,
      coalesce((
        select count(*)::integer
        from public.message m
        where m.chat_room_id = room.id
          and m.created_at > coalesce(member.last_read_at, 'epoch'::timestamptz)
          and m.user_id <> p_user_id
      ), 0) as unread_count
    from public.chat_room as room
    join public."user" as owner on owner.id = room.owner_id
    join public.chat_room_member as member on member.chat_room_id = room.id
    where member.user_id = p_user_id
      and member.is_banned = false
      and member.last_joined_at is not null
    order by room.created_at desc;
  elsif upper(p_tab_type) = 'NOT_JOINED' then
    return query
    select room.id, room.title, room.description, room.max_capacity::integer,
      room.current_member, room.owner_id, owner.nickname, room.created_at,
      0::integer as unread_count
    from public.chat_room as room
    join public."user" as owner on owner.id = room.owner_id
    left join public.chat_room_member as member
      on member.chat_room_id = room.id
     and member.user_id = p_user_id
    where room.owner_id <> p_user_id
      and (
        member.user_id is null
        or (member.is_banned = false and member.last_joined_at is null)
      )
    order by room.created_at desc;
  end if;
end;
$function$;

create or replace function public.join_chat_room(p_chat_room_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_user_id uuid;
  v_max_capacity integer;
  v_active_count integer;
  v_member record;
  v_has_member boolean := false;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return 'unauthorized';
  end if;

  select is_banned, last_joined_at into v_member
  from public.chat_room_member
  where chat_room_id = p_chat_room_id and user_id = v_user_id;

  v_has_member := found;

  if found then
    if v_member.is_banned then
      return 'banned';
    end if;

    if v_member.last_joined_at is not null then
      update public.chat_room_member
      set last_joined_at = now()
      where chat_room_id = p_chat_room_id and user_id = v_user_id;

      return '';
    end if;
  end if;

  select max_capacity into v_max_capacity
  from public.chat_room
  where id = p_chat_room_id
  for update;

  if not found then
    return 'not_found';
  end if;

  select count(*) into v_active_count
  from public.chat_room_member
  where chat_room_id = p_chat_room_id
    and is_banned = false
    and last_joined_at is not null;

  if v_active_count >= v_max_capacity then
    return 'full';
  end if;

  if v_has_member then
    update public.chat_room_member
    set last_joined_at = now()
    where chat_room_id = p_chat_room_id and user_id = v_user_id;
  else
    insert into public.chat_room_member (chat_room_id, user_id, last_joined_at)
    values (p_chat_room_id, v_user_id, now());
  end if;

  return '';
end;
$function$;

create or replace function public.leave_chat_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  room_owner uuid;
  active_member_count integer;
  updated_rows integer;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select r.owner_id, r.current_member
  into room_owner, active_member_count
  from public.chat_room r
  where r.id = p_room_id
  for update;

  if room_owner is null then
    raise exception 'room not found';
  end if;

  if room_owner = uid and active_member_count > 1 then
    raise exception 'owner cannot leave';
  end if;

  update public.chat_room_member m
  set last_joined_at = null
  where m.chat_room_id = p_room_id
    and m.user_id = uid
    and m.is_banned = false
    and m.last_joined_at is not null;

  get diagnostics updated_rows = row_count;

  if updated_rows = 0 then
    raise exception 'not an active member';
  end if;
end;
$function$;

create or replace function public.mark_room_read(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  update public.chat_room_member
  set last_read_at = greatest(
    coalesce(last_read_at, 'epoch'::timestamptz),
    timezone('utc', now())
  )
  where chat_room_id = p_room_id
    and user_id = uid;
end;
$function$;

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
security definer
set search_path to 'public'
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
      select count(*) over () as total_count, chat_room.id, chat_room.title,
        coalesce(chat_room.description, '') as description, chat_room.owner_id,
        "user".nickname as owner_nickname, chat_room.current_member::integer as current_member,
        chat_room.max_capacity::integer as max_capacity, chat_room.created_at
      from public.chat_room
      join public."user" on "user".id = chat_room.owner_id
      where chat_room.title ilike '%' || v_query || '%'
      order by chat_room.created_at desc, chat_room.id desc
      limit v_limit
      offset case when p_section = 'title' then v_offset else 0 end
    )
    select 'title'::text, matched_rooms.id, matched_rooms.title, matched_rooms.description,
      matched_rooms.owner_id, matched_rooms.owner_nickname, matched_rooms.current_member,
      matched_rooms.max_capacity, matched_rooms.created_at,
      matched_rooms.total_count > v_offset + v_limit
    from matched_rooms;
  end if;

  if p_section is null or p_section = 'owner' then
    return query
    with matched_rooms as (
      select count(*) over () as total_count, chat_room.id, chat_room.title,
        coalesce(chat_room.description, '') as description, chat_room.owner_id,
        "user".nickname as owner_nickname, chat_room.current_member::integer as current_member,
        chat_room.max_capacity::integer as max_capacity, chat_room.created_at
      from public.chat_room
      join public."user" on "user".id = chat_room.owner_id
      where regexp_replace("user".nickname, '\s+', '', 'g') ilike '%' || v_owner_query || '%'
      order by chat_room.created_at desc, chat_room.id desc
      limit v_limit
      offset case when p_section = 'owner' then v_offset else 0 end
    )
    select 'owner'::text, matched_rooms.id, matched_rooms.title, matched_rooms.description,
      matched_rooms.owner_id, matched_rooms.owner_nickname, matched_rooms.current_member,
      matched_rooms.max_capacity, matched_rooms.created_at,
      matched_rooms.total_count > v_offset + v_limit
    from matched_rooms;
  end if;
end;
$function$;

create or replace function public.kick_chat_room_member(p_room_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  room_owner uuid;
  updated_rows integer;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select r.owner_id into room_owner
  from public.chat_room r
  where r.id = p_room_id;

  if room_owner is null then
    raise exception 'room not found';
  end if;

  if room_owner <> uid then
    raise exception 'only owner can kick members';
  end if;

  if p_target_user_id = uid then
    raise exception 'owner cannot kick self';
  end if;

  update public.chat_room_member m
  set is_banned = true,
      last_joined_at = null
  where m.chat_room_id = p_room_id
    and m.user_id = p_target_user_id
    and m.is_banned = false
    and m.last_joined_at is not null;

  get diagnostics updated_rows = row_count;

  if updated_rows = 0 then
    raise exception 'target is not an active member';
  end if;
end;
$function$;

create or replace function public.transfer_chat_room_owner(p_room_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  room_owner uuid;
  target_nickname text;
  updated_rows integer;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select r.owner_id into room_owner
  from public.chat_room r
  where r.id = p_room_id;

  if room_owner is null then
    raise exception 'room not found';
  end if;

  if room_owner <> uid then
    raise exception 'only owner can transfer ownership';
  end if;

  if p_target_user_id = uid then
    raise exception 'owner cannot transfer to self';
  end if;

  select u.nickname into target_nickname
  from public.chat_room_member m
  join public."user" u on u.id = m.user_id
  where m.chat_room_id = p_room_id
    and m.user_id = p_target_user_id
    and m.is_banned = false
    and m.last_joined_at is not null;

  if target_nickname is null then
    raise exception 'target is not an active member';
  end if;

  update public.chat_room r
  set owner_id = p_target_user_id
  where r.id = p_room_id
    and r.owner_id = uid;

  get diagnostics updated_rows = row_count;

  if updated_rows = 0 then
    raise exception 'owner transfer failed';
  end if;

  insert into public.message (chat_room_id, user_id, content, message_type)
  values (
    p_room_id,
    uid,
    target_nickname || '님에게 방장 권한이 위임되었습니다.',
    'system'
  );
end;
$function$;

drop trigger if exists set_user_modified_at on public."user";
create trigger set_user_modified_at
before update on public."user"
for each row execute function public.update_modified_column();

drop trigger if exists set_chatroom_modified_at on public.chat_room;
create trigger set_chatroom_modified_at
before update on public.chat_room
for each row execute function public.update_modified_column();

drop trigger if exists trigger_delete_empty_chat_room on public.chat_room;
create trigger trigger_delete_empty_chat_room
after update on public.chat_room
for each row execute function public.delete_empty_chat_room();

drop trigger if exists trigger_update_member_count on public.chat_room_member;
create trigger trigger_update_member_count
after insert or delete or update on public.chat_room_member
for each row execute function public.update_member_count();

drop trigger if exists trigger_insert_chat_room_member_system_message on public.chat_room_member;
create trigger trigger_insert_chat_room_member_system_message
after insert or update on public.chat_room_member
for each row execute function public.insert_chat_room_member_system_message();

drop trigger if exists set_message_modified_at on public.message;
create trigger set_message_modified_at
before update on public.message
for each row execute function public.update_modified_column();

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
after delete on auth.users
for each row execute function public.delete_user_storage_on_delete();

drop trigger if exists on_auth_user_deleted_delete_public_user on auth.users;
create trigger on_auth_user_deleted_delete_public_user
after delete on auth.users
for each row execute function private.delete_public_user_on_auth_delete();

create policy "Authenticated users can read users"
on public."user" for select
to authenticated
using (true);

create policy "Users can insert own user row"
on public."user" for insert
to authenticated
with check (id = (select auth.uid() as uid));

create policy "Users can update own user row"
on public."user" for update
to authenticated
using (id = (select auth.uid() as uid))
with check (id = (select auth.uid() as uid));

create policy "Authenticated users can read chat rooms"
on public.chat_room for select
to authenticated
using (true);

create policy "Users can create own chat rooms"
on public.chat_room for insert
to authenticated
with check (owner_id = (select auth.uid() as uid));

create policy "Owners can update own chat rooms"
on public.chat_room for update
to authenticated
using (owner_id = (select auth.uid() as uid))
with check (owner_id = (select auth.uid() as uid));

create policy "Owners can delete own chat rooms"
on public.chat_room for delete
to authenticated
using (owner_id = (select auth.uid() as uid));

create policy "Authenticated users can read room members"
on public.chat_room_member for select
to authenticated
using (true);

create policy "Users can join rooms as themselves"
on public.chat_room_member for insert
to authenticated
with check (
  user_id = (select auth.uid() as uid)
  and is_banned = false
  and last_joined_at is not null
  and exists (
    select 1
    from public.chat_room room
    where room.id = chat_room_member.chat_room_id
      and room.current_member < room.max_capacity
  )
);

create policy "Users can update own room member read and joined state"
on public.chat_room_member for update
to authenticated
using (user_id = auth.uid() and is_banned = false)
with check (user_id = auth.uid() and is_banned = false);

create policy "Room members can read messages"
on public.message for select
to authenticated
using (
  exists (
    select 1
    from public.chat_room_member member
    where member.chat_room_id = message.chat_room_id
      and member.user_id = (select auth.uid() as uid)
      and member.is_banned = false
      and member.last_joined_at is not null
  )
);

create policy "Room members can create own messages"
on public.message for insert
to authenticated
with check (
  user_id = (select auth.uid() as uid)
  and exists (
    select 1
    from public.chat_room_member member
    where member.chat_room_id = message.chat_room_id
      and member.user_id = (select auth.uid() as uid)
      and member.is_banned = false
      and member.last_joined_at is not null
  )
);

create policy "Message authors can update own messages"
on public.message for update
to authenticated
using (user_id = (select auth.uid() as uid))
with check (user_id = (select auth.uid() as uid));

create policy "Message authors can delete own messages"
on public.message for delete
to authenticated
using (user_id = (select auth.uid() as uid));

alter publication supabase_realtime add table public.chat_room;
alter publication supabase_realtime add table public.chat_room_member;
alter publication supabase_realtime add table public.message;

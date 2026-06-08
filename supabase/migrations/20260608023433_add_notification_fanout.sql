-- 알림 fan-out 공용 함수 + 트리거(best-effort) + 읽음 처리 RPC

create or replace function public.emit_follower_notification(
  p_actor_id uuid, p_type text, p_resource_id uuid,
  p_title text, p_body text, p_link_path text
) returns void
language plpgsql security definer set search_path to '' as $function$
declare
  v_nickname text;
  v_photo text;
begin
  select u.nickname, u.photo_url into v_nickname, v_photo
  from public."user" as u where u.id = p_actor_id;

  insert into public.notification
    (recipient_id, type, actor_id, actor_nickname, actor_photo_url, title, body, link_path, resource_id)
  select vcr.viewer_id, p_type, p_actor_id, v_nickname, v_photo, p_title, p_body, p_link_path, p_resource_id
  from public.viewer_creator_relation as vcr
  where vcr.creator_id = p_actor_id
    and vcr.followed_at is not null
    and vcr.viewer_id <> p_actor_id;
end;
$function$;

-- 라이브 시작 트리거 (예외 무시 = 방송 생성 무영향)
create or replace function public.notify_followers_on_live_start()
returns trigger language plpgsql security definer set search_path to '' as $function$
declare v_nickname text;
begin
  begin
    select u.nickname into v_nickname from public."user" as u where u.id = new.creator_id;
    perform public.emit_follower_notification(
      new.creator_id, 'live_start', new.id,
      coalesce(v_nickname, '크리에이터') || '님이 라이브를 시작했어요',
      new.title,
      '/live/' || new.creator_id::text
    );
  exception when others then
    null; -- 알림 실패가 부모 INSERT를 롤백하지 않도록 무시
  end;
  return new;
end;
$function$;

drop trigger if exists notify_followers_on_live_start on public.live_broadcast;
create trigger notify_followers_on_live_start
  after insert on public.live_broadcast
  for each row execute function public.notify_followers_on_live_start();

-- 커뮤니티 글 트리거 (예외 무시)
create or replace function public.notify_followers_on_community_post()
returns trigger language plpgsql security definer set search_path to '' as $function$
declare v_nickname text;
begin
  begin
    select u.nickname into v_nickname from public."user" as u where u.id = new.creator_id;
    perform public.emit_follower_notification(
      new.creator_id, 'community_post', new.id,
      coalesce(v_nickname, '크리에이터') || '님이 새 글을 올렸어요',
      left(new.content, 60),
      '/channel/' || new.creator_id::text || '/community/' || new.id::text
    );
  exception when others then
    null;
  end;
  return new;
end;
$function$;

drop trigger if exists notify_followers_on_community_post on public.community_post;
create trigger notify_followers_on_community_post
  after insert on public.community_post
  for each row execute function public.notify_followers_on_community_post();

-- 읽음(방문 기준) 처리 RPC
create or replace function public.mark_notifications_seen(p_actor_user_id uuid)
returns void language plpgsql security definer set search_path to '' as $function$
begin
  update public."user" set notifications_last_seen_at = now() where id = p_actor_user_id;
end;
$function$;

-- 권한 잠금: 트리거는 owner 권한으로 emit 호출, mark_seen은 service_role(서버 액션)만
revoke all on function public.emit_follower_notification(uuid, text, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.mark_notifications_seen(uuid) from public, anon, authenticated;
grant execute on function public.mark_notifications_seen(uuid) to service_role;

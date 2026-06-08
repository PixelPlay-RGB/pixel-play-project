-- 알림 fan-out 트리거: best-effort는 유지하되 실패를 RAISE WARNING으로 관측 가능하게 한다.
-- (RAISE WARNING은 부모 트랜잭션을 롤백하지 않으므로 방송/글 INSERT에는 영향 없음)

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
    raise warning 'notify_followers_on_live_start 실패 (broadcast=%): %', new.id, sqlerrm;
  end;
  return new;
end;
$function$;

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
    raise warning 'notify_followers_on_community_post 실패 (post=%): %', new.id, sqlerrm;
  end;
  return new;
end;
$function$;

-- 라이브 폴 옵션 개수 2~5개 가드 복원 (2026-06-10 제거됐던 상한을 팀 QA 기준으로 재도입).
-- zod·UI도 max(5)로 막지만, RPC 심층 방어선으로 직접 호출(서비스 롤) 시에도 보장한다.

create or replace function public.create_live_poll(p_actor_user_id uuid, p_broadcast_id uuid, p_title text, p_options jsonb, p_ends_at timestamp with time zone default null::timestamp with time zone)
 returns uuid
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_poll_id uuid;
begin
  if p_actor_user_id is null then raise sqlstate 'PX401' using message = 'not authenticated'; end if;

  if jsonb_typeof(p_options) is distinct from 'array'
     or jsonb_array_length(p_options) < 2
     or jsonb_array_length(p_options) > 5 then
    raise sqlstate 'PX400' using message = 'poll options must be between 2 and 5';
  end if;

  perform 1
  from public.live_broadcast as broadcast
  where broadcast.id = p_broadcast_id and broadcast.creator_id = p_actor_user_id and broadcast.ended_at is null;
  if not found then raise sqlstate 'PX404' using message = 'active live broadcast not found'; end if;

  insert into public.live_poll (broadcast_id, title, options, ends_at)
  values (p_broadcast_id, btrim(coalesce(p_title, '')), p_options, p_ends_at)
  returning id into v_poll_id;

  return v_poll_id;
end;
$function$;

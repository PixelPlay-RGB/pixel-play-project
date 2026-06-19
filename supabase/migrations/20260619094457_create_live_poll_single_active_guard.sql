-- GAP-006: 한 방송에 활성 투표(ended_at IS NULL)는 하나만 보장한다.
-- create_live_poll이 기존 active를 닫지 않고 무조건 insert해, 연속/동시 호출 시 활성 투표가
-- 여러 개 생기던 문제를 막는다. advisory xact lock으로 같은 방송의 생성 요청을 직렬화해
-- '기존 active 종료 → 새 투표 insert'가 원자적으로 일어나게 한다(동시 2개 생성 race 차단).
create or replace function public.create_live_poll(
  p_actor_user_id uuid,
  p_broadcast_id uuid,
  p_title text,
  p_options jsonb,
  p_ends_at timestamp with time zone default null::timestamp with time zone
)
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
  where broadcast.id = p_broadcast_id
    and broadcast.creator_id = p_actor_user_id
    and broadcast.ended_at is null;
  if not found then raise sqlstate 'PX404' using message = 'active live broadcast not found'; end if;

  -- 같은 방송에 대한 투표 생성 요청을 트랜잭션 단위로 직렬화한다.
  perform pg_advisory_xact_lock(hashtextextended(p_broadcast_id::text, 0));

  -- 한 방송에 활성 투표는 하나만 — 새 투표를 시작하면 진행 중이던 투표는 자동 종료한다.
  update public.live_poll
     set ended_at = now(), modified_at = now()
   where broadcast_id = p_broadcast_id and ended_at is null;

  insert into public.live_poll (broadcast_id, title, options, ends_at)
  values (p_broadcast_id, btrim(coalesce(p_title, '')), p_options, p_ends_at)
  returning id into v_poll_id;

  return v_poll_id;
end;
$function$;

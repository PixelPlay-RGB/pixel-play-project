-- 라이브 투표 표 취소(unvote) 지원.
-- 제품 규칙(README): "같은 항목을 다시 누르면 무효표(표 취소), 다른 항목은 선택 변경".
-- 기존엔 같은 항목 재선택 시 vote_live_poll이 no-op(return)이라 표가 그대로 유지됐다.
-- 변경: 같은 항목 재선택 시 표 행을 DELETE해 표를 취소한다.
-- count 유지는 트리거 단독 책임 규칙(20260606023111)을 지키기 위해, RPC는 표 행 DELETE만 하고
-- options[].count 감소는 increment_poll_option_count 트리거의 DELETE 분기가 처리한다.

-- 1) count 트리거에 DELETE 감소 분기 추가. INSERT/UPDATE 동작은 기존과 동일.
create or replace function public.increment_poll_option_count()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if TG_OP = 'INSERT' then
    update public.live_poll
    set options = (
      select jsonb_agg(
        case
          when (opt ->> 'id') = NEW.option_id
            then jsonb_set(opt, '{count}', to_jsonb(coalesce((opt ->> 'count')::int, 0) + 1))
          else opt
        end
      )
      from jsonb_array_elements(options) as opt
    )
    where id = NEW.poll_id;

  elsif TG_OP = 'UPDATE' and OLD.option_id is distinct from NEW.option_id then
    update public.live_poll
    set options = (
      select jsonb_agg(
        case
          when (opt ->> 'id') = OLD.option_id
            then jsonb_set(opt, '{count}', to_jsonb(greatest(coalesce((opt ->> 'count')::int, 0) - 1, 0)))
          when (opt ->> 'id') = NEW.option_id
            then jsonb_set(opt, '{count}', to_jsonb(coalesce((opt ->> 'count')::int, 0) + 1))
          else opt
        end
      )
      from jsonb_array_elements(options) as opt
    )
    where id = NEW.poll_id;

  elsif TG_OP = 'DELETE' then
    -- 표 취소(unvote). 해당 옵션 count를 1 감소(0 미만 방지).
    -- 방송/투표 삭제로 인한 cascade DELETE 시에는 부모 live_poll 행이 먼저 삭제되어
    -- 이 UPDATE가 0행 no-op이 되므로 안전하다.
    update public.live_poll
    set options = (
      select jsonb_agg(
        case
          when (opt ->> 'id') = OLD.option_id
            then jsonb_set(opt, '{count}', to_jsonb(greatest(coalesce((opt ->> 'count')::int, 0) - 1, 0)))
          else opt
        end
      )
      from jsonb_array_elements(options) as opt
    )
    where id = OLD.poll_id;

    return OLD;
  end if;

  return NEW;
end;
$function$;

-- 트리거가 DELETE에도 발화하도록 재생성(INSERT/UPDATE는 기존과 동일).
drop trigger if exists on_live_poll_vote_upsert on public.live_poll_vote;
create trigger on_live_poll_vote_upsert
after insert or update or delete on public.live_poll_vote
for each row execute function public.increment_poll_option_count();

-- 2) vote_live_poll: 같은 항목 재선택 = 표 취소(unvote). 표 행 DELETE만, count는 트리거가 처리.
create or replace function public.vote_live_poll(
  p_actor_user_id uuid,
  p_poll_id uuid,
  p_option_id text
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_poll record;
  v_option_id text := btrim(coalesce(p_option_id, ''));
  v_previous_option_id text;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  select poll.id, poll.options, poll.ends_at, poll.ended_at
  into v_poll
  from public.live_poll as poll
  join public.live_broadcast as broadcast
    on broadcast.id = poll.broadcast_id
  where poll.id = p_poll_id
    and broadcast.ended_at is null
  for update of poll;

  if not found then
    raise sqlstate 'PX404' using message = 'active poll not found';
  end if;

  if v_poll.ended_at is not null
    or (v_poll.ends_at is not null and v_poll.ends_at <= now()) then
    raise sqlstate 'PX409' using message = 'poll already ended';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(v_poll.options) as option_item
    where option_item ->> 'id' = v_option_id
  ) then
    raise sqlstate 'PX400' using message = 'invalid poll option';
  end if;

  select vote.option_id
  into v_previous_option_id
  from public.live_poll_vote as vote
  where vote.poll_id = p_poll_id
    and vote.voter_id = p_actor_user_id
  for update;

  -- 같은 항목 재선택 = 표 취소(unvote). 행 삭제만 하고 count 감소는 트리거가 처리한다.
  if v_previous_option_id = v_option_id then
    delete from public.live_poll_vote as vote
    where vote.poll_id = p_poll_id
      and vote.voter_id = p_actor_user_id;
    return;
  end if;

  -- options[].count는 on_live_poll_vote_upsert 트리거가 단독으로 유지한다(중복 증감 금지).
  insert into public.live_poll_vote (
    poll_id,
    voter_id,
    option_id
  )
  values (
    p_poll_id,
    p_actor_user_id,
    v_option_id
  )
  on conflict (poll_id, voter_id)
  do update set option_id = excluded.option_id;
end;
$function$;

revoke execute on function public.vote_live_poll(uuid, uuid, text) from public;
revoke execute on function public.vote_live_poll(uuid, uuid, text) from anon;
revoke execute on function public.vote_live_poll(uuid, uuid, text) from authenticated;
grant execute on function public.vote_live_poll(uuid, uuid, text) to service_role;

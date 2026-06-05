-- 투표 이중 집계 버그 수정.
-- 원인: live_poll_vote 트리거(increment_poll_option_count)와 vote_live_poll RPC가
-- 둘 다 live_poll.options[].count를 증감해 모든 표가 2배로 집계됐다.
-- 해결: count 유지는 트리거 단독 책임으로 두고, RPC에서 중복 count 로직을 제거한다.
-- 트리거는 DB에만 있고 마이그레이션에 없었으므로 여기서 함께 미러링한다.

-- 1) count 유지 트리거(단일 출처) 미러링. 기존 정의와 동일(재적용 안전).
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
  end if;

  return NEW;
end;
$function$;

drop trigger if exists on_live_poll_vote_upsert on public.live_poll_vote;
create trigger on_live_poll_vote_upsert
after insert or update on public.live_poll_vote
for each row execute function public.increment_poll_option_count();

-- 2) vote_live_poll에서 중복 count 로직 제거. 표 upsert만 하고 count는 트리거에 맡긴다.
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

  if v_previous_option_id = v_option_id then
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

-- 3) 이미 2배가 된 기존 count를 실제 live_poll_vote 행 수로 재계산(데이터 보정).
update public.live_poll as poll
set options = (
  select jsonb_agg(
    jsonb_set(entry.opt, '{count}', to_jsonb(coalesce(vote_count.cnt, 0)))
    order by entry.ord
  )
  from jsonb_array_elements(poll.options) with ordinality as entry(opt, ord)
  left join (
    select vote.option_id, count(*)::int as cnt
    from public.live_poll_vote as vote
    where vote.poll_id = poll.id
    group by vote.option_id
  ) as vote_count on vote_count.option_id = entry.opt ->> 'id'
)
-- 옵션이 빈 배열이면 jsonb_agg가 NULL을 반환해 options를 NULL로 만들므로 제외한다.
where jsonb_typeof(poll.options) = 'array'
  and jsonb_array_length(poll.options) > 0;

revoke execute on function public.vote_live_poll(uuid, uuid, text) from public;
revoke execute on function public.vote_live_poll(uuid, uuid, text) from anon;
revoke execute on function public.vote_live_poll(uuid, uuid, text) from authenticated;
grant execute on function public.vote_live_poll(uuid, uuid, text) to service_role;

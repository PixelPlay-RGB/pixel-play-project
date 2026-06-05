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

  update public.live_poll as poll
  set options = (
    select jsonb_agg(
      case
        when option_item.item ->> 'id' = v_option_id then
          jsonb_set(
            option_item.item,
            '{count}',
            to_jsonb(
              case
                when (option_item.item ->> 'count') ~ '^[0-9]+$'
                  then (option_item.item ->> 'count')::integer + 1
                else 1
              end
            ),
            true
          )
        when v_previous_option_id is not null
          and option_item.item ->> 'id' = v_previous_option_id then
          jsonb_set(
            option_item.item,
            '{count}',
            to_jsonb(
              greatest(
                case
                  when (option_item.item ->> 'count') ~ '^[0-9]+$'
                    then (option_item.item ->> 'count')::integer
                  else 0
                end - 1,
                0
              )
            ),
            true
          )
        else option_item.item
      end
      order by option_item.ordinality
    )
    from jsonb_array_elements(poll.options) with ordinality as option_item(item, ordinality)
  )
  where poll.id = p_poll_id;
end;
$function$;

revoke execute on function public.vote_live_poll(uuid, uuid, text) from public;
revoke execute on function public.vote_live_poll(uuid, uuid, text) from anon;
revoke execute on function public.vote_live_poll(uuid, uuid, text) from authenticated;
grant execute on function public.vote_live_poll(uuid, uuid, text) to service_role;

drop function if exists public.vote_live_poll_2(uuid, uuid, text);
drop function if exists public.vote_live_poll_2(uuid, uuid, uuid);

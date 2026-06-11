-- 투표·추첨 등 시청자 참여 도구의 공지 메시지를 채팅 목록에서 숨긴다.
-- (원격에 먼저 적용돼 있던 마이그레이션을 정합 컨벤션에 따라 파일로 받아 적은 것 — SQL은 원격 기록 원문과 동일)

alter table public.live_message
  add column if not exists is_chat_visible boolean not null default true;

update public.live_message
set is_chat_visible = false
where metadata @> '{"source": "live_interaction"}'::jsonb
  or metadata @> '{"source": "live_draw_participation"}'::jsonb;

create index if not exists live_message_visible_broadcast_created_at_idx
  on public.live_message using btree (broadcast_id, created_at desc)
  where is_chat_visible = true;

create or replace function public.send_live_interaction_notice(
  p_actor_user_id uuid,
  p_broadcast_id uuid,
  p_interaction_type text,
  p_content text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_content text := btrim(coalesce(p_content, ''));
  v_interaction_type text := btrim(coalesce(p_interaction_type, ''));
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_message_id uuid;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_broadcast_id is null then
    raise sqlstate 'PX400' using message = 'invalid broadcast';
  end if;

  if v_interaction_type not in ('poll', 'draw', 'roulette') then
    raise sqlstate 'PX400' using message = 'invalid interaction type';
  end if;

  if char_length(v_content) = 0 or char_length(v_content) > 300 then
    raise sqlstate 'PX400' using message = 'invalid notice content';
  end if;

  if jsonb_typeof(v_metadata) <> 'object' then
    raise sqlstate 'PX400' using message = 'invalid metadata';
  end if;

  perform 1
  from public.live_broadcast as broadcast
  where broadcast.id = p_broadcast_id
    and broadcast.creator_id = p_actor_user_id
    and broadcast.ended_at is null;

  if not found then
    raise sqlstate 'PX404' using message = 'active live broadcast not found';
  end if;

  insert into public.live_message (
    broadcast_id,
    sender_id,
    message_type,
    content,
    metadata,
    is_chat_visible
  )
  values (
    p_broadcast_id,
    p_actor_user_id,
    'moderation_notice'::public.live_message_type,
    v_content,
    v_metadata || jsonb_build_object(
      'source', 'live_interaction',
      'interactionType', v_interaction_type
    ),
    false
  )
  returning id into v_message_id;

  return v_message_id;
end;
$function$;

-- 정산 내역(월별 후원) 조회 RPC를 추가합니다.
CREATE OR REPLACE FUNCTION public.get_creator_settlement_donations(
  p_actor_user_id uuid,
  p_month text,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_total integer;
  v_items jsonb;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  v_start := to_timestamp(p_month || '-01', 'YYYY-MM-DD');
  v_end := v_start + interval '1 month';

  select count(*)::integer
  into v_total
  from public.donation as d
  where d.creator_id = p_actor_user_id
    and d.created_at >= v_start
    and d.created_at < v_end;

  select coalesce(jsonb_agg(t.item order by t.created_at desc), '[]'::jsonb)
  into v_items
  from (
    select
      jsonb_build_object(
        'id', d.id,
        'donorNickname', case when d.is_anonymous then '익명' else donor.nickname end,
        'amount', d.amount,
        'message', d.message,
        'createdAt', d.created_at
      ) as item,
      d.created_at
    from public.donation as d
    join public."user" as donor on donor.id = d.donor_id
    where d.creator_id = p_actor_user_id
      and d.created_at >= v_start
      and d.created_at < v_end
    order by d.created_at desc
    limit greatest(p_limit, 0)
    offset greatest(p_offset, 0)
  ) as t;

  return jsonb_build_object('items', v_items, 'totalCount', v_total);
end;
$function$;

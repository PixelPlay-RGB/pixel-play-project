-- 정산 상세 내역: 연도 + 정산 상태 + 정렬을 지원하도록 재설계합니다.
-- 기존 월(text) 기반 시그니처는 제거합니다.
DROP FUNCTION IF EXISTS public.get_creator_settlement_donations(uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_creator_settlement_donations(
  p_actor_user_id uuid,
  p_year integer,
  p_status text DEFAULT 'all',
  p_sort text DEFAULT 'latest',
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
  v_current_month_start timestamptz;
  v_total integer;
  v_items jsonb;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  v_start := make_timestamptz(p_year, 1, 1, 0, 0, 0, 'Asia/Seoul');
  v_end := v_start + interval '1 year';
  -- 이번 달(서울 기준)부터는 아직 정산 전(정산 예정), 그 이전은 정산 완료로 간주합니다.
  v_current_month_start := date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';

  select count(*)::integer
  into v_total
  from public.donation as d
  where d.creator_id = p_actor_user_id
    and d.created_at >= v_start
    and d.created_at < v_end
    and (
      p_status = 'all'
      or (p_status = 'completed' and d.created_at < v_current_month_start)
      or (p_status = 'scheduled' and d.created_at >= v_current_month_start)
    );

  select coalesce(jsonb_agg(t.item order by t.rn), '[]'::jsonb)
  into v_items
  from (
    select
      jsonb_build_object(
        'id', d.id,
        'donorNickname', case when d.is_anonymous then '익명' else donor.nickname end,
        'amount', d.amount,
        'message', d.message,
        'createdAt', d.created_at,
        'status', case when d.created_at < v_current_month_start then 'completed' else 'scheduled' end
      ) as item,
      row_number() over (
        order by
          case when p_sort = 'amount' then d.amount end desc nulls last,
          d.created_at desc
      ) as rn
    from public.donation as d
    join public."user" as donor on donor.id = d.donor_id
    where d.creator_id = p_actor_user_id
      and d.created_at >= v_start
      and d.created_at < v_end
      and (
        p_status = 'all'
        or (p_status = 'completed' and d.created_at < v_current_month_start)
        or (p_status = 'scheduled' and d.created_at >= v_current_month_start)
      )
    order by rn
    limit greatest(p_limit, 0)
    offset greatest(p_offset, 0)
  ) as t;

  return jsonb_build_object('items', v_items, 'totalCount', v_total);
end;
$function$;

-- 연도별 총 정산액 요약(수수료/정산예정액은 앱 계층에서 동일 비율로 계산).
CREATE OR REPLACE FUNCTION public.get_creator_settlement_yearly_summary(p_actor_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_items jsonb;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'year', y.year,
      'donationTotal', y.donation_total,
      'donationCount', y.donation_count
    ) order by y.year desc
  ), '[]'::jsonb)
  into v_items
  from (
    select
      extract(year from d.created_at at time zone 'Asia/Seoul')::integer as year,
      coalesce(sum(d.amount), 0)::bigint as donation_total,
      count(*)::integer as donation_count
    from public.donation as d
    where d.creator_id = p_actor_user_id
    group by 1
  ) as y;

  return v_items;
end;
$function$;

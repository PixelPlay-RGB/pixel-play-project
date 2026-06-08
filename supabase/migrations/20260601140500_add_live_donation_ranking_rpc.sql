-- 라이브 시청 화면의 이번 주 후원 랭킹(후원자 단위 합산) 조회 RPC.
-- get_live_watch_count 와 동일하게 client에서 직접 호출하는 security definer 집계 read.
-- 집계 키는 (donor_id, is_anonymous) 이다. 즉 같은 사람이라도 공개 후원과 익명 후원은
-- 서로 다른 랭킹 행으로 "분기"되어 익명 금액이 실명 닉네임 총액에 섞이지 않는다.
--   - 공개 후원 행: author 는 후원자 닉네임.
--   - 익명 후원 행: author 는 donor_id 로부터 결정적으로 뽑은 동물 의사 닉네임("익명의 너구리").
--     같은 익명 후원자는 한 주 내내 같은 이름으로 합산되고, 서로 다른 익명 후원자는 이름으로 구분된다.
--     신원은 노출하지 않는다(message 등 후원 본문은 응답에 포함하지 않는다).
-- 주(week) 경계는 KST(Asia/Seoul) 월요일 00:00 기준이다.

-- 익명 후원자 표시용 의사 닉네임. donor_id 해시로 동물 풀에서 결정적으로 선택한다.
-- 랭킹(get_live_donation_ranking)과 후원 채팅 메시지(send_live_donation)가 동일 alias 를
-- 쓰도록 공유한다. 신원은 노출하지 않으며 같은 donor_id 는 항상 같은 이름이 된다.
create or replace function public.anonymous_donor_alias(p_donor_id uuid)
returns text
language sql
immutable
set search_path to ''
as $function$
  select '익명의 ' || (
    array[
      '너구리', '수달', '여우', '고양이', '강아지', '판다', '햄스터', '토끼',
      '다람쥐', '펭귄', '고슴도치', '비버', '알파카', '코알라', '두더지', '카피바라',
      '미어캣', '청설모', '돌고래', '부엉이', '사슴', '호랑이', '사자', '곰',
      '늑대', '치타', '표범', '코끼리', '기린', '얼룩말', '하마', '코뿔소',
      '캥거루', '나무늘보', '오소리', '족제비', '담비', '물개', '올빼미', '두루미'
    ]
  )[(pg_catalog.hashtextextended(p_donor_id::text, 0) % 40 + 40) % 40 + 1];
$function$;

revoke execute on function public.anonymous_donor_alias(uuid) from public;
grant execute on function public.anonymous_donor_alias(uuid) to anon;
grant execute on function public.anonymous_donor_alias(uuid) to authenticated;
grant execute on function public.anonymous_donor_alias(uuid) to service_role;

create or replace function public.get_live_donation_ranking(
  p_creator_id uuid,
  p_limit integer default 3
)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  with weekly_donation as (
    select
      donation.donor_id,
      donation.id,
      donation.amount,
      donation.is_anonymous,
      donation.created_at,
      donor.nickname as donor_nickname
    from public.donation as donation
    join public."user" as donor
      on donor.id = donation.donor_id
    where donation.creator_id = p_creator_id
      and donation.created_at >= date_trunc('week', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'
  ),
  ranked as (
    select
      (array_agg(weekly_donation.id order by weekly_donation.created_at desc))[1] as id,
      case
        when weekly_donation.is_anonymous
          then public.anonymous_donor_alias(weekly_donation.donor_id)
        else max(weekly_donation.donor_nickname)
      end as author,
      sum(weekly_donation.amount)::bigint as amount,
      max(weekly_donation.created_at) as last_donated_at
    from weekly_donation
    group by weekly_donation.donor_id, weekly_donation.is_anonymous
    order by sum(weekly_donation.amount) desc, max(weekly_donation.created_at) desc
    limit least(greatest(coalesce(p_limit, 3), 1), 100)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', ranked.id,
        'author', ranked.author,
        'amount', ranked.amount
      )
      order by ranked.amount desc, ranked.last_donated_at desc
    ),
    '[]'::jsonb
  )
  from ranked;
$function$;

revoke execute on function public.get_live_donation_ranking(uuid, integer) from public;
grant execute on function public.get_live_donation_ranking(uuid, integer) to anon;
grant execute on function public.get_live_donation_ranking(uuid, integer) to authenticated;
grant execute on function public.get_live_donation_ranking(uuid, integer) to service_role;

-- 구독 결제 기록 테이블의 클라이언트 접근을 명시적으로 막고 FK 조회 인덱스를 보강한다.

create index if not exists creator_subscription_payment_subscription_id_idx
  on public.creator_subscription_payment (subscription_id)
  where subscription_id is not null;

drop policy if exists creator_subscription_payment_deny_client_access
  on public.creator_subscription_payment;

create policy creator_subscription_payment_deny_client_access
  on public.creator_subscription_payment
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

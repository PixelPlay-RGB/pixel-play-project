-- 크리에이터 구독 조회 정책을 하나로 합쳐 advisor 경고를 줄인다.

drop policy if exists creator_subscription_select_as_subscriber on public.creator_subscription;
drop policy if exists creator_subscription_select_as_creator on public.creator_subscription;

drop policy if exists creator_subscription_select_visible_relation on public.creator_subscription;
create policy creator_subscription_select_visible_relation
  on public.creator_subscription
  for select
  to authenticated
  using (
    subscriber_id = (select auth.uid())
    or creator_id = (select auth.uid())
  );

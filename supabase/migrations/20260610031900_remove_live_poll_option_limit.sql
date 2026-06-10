-- live_poll 옵션은 최소 2개만 요구하고 최대 개수 제한은 제거한다.
alter table public.live_poll
  drop constraint if exists live_poll_options_array;

alter table public.live_poll
  add constraint live_poll_options_array check (
    jsonb_typeof(options) = 'array'
    and jsonb_array_length(options) >= 2
  );

-- Keep peak viewer statistics consistent whenever the active viewer count changes.

create or replace function public.sync_live_broadcast_peak_viewer_count()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.current_viewer_count > new.peak_viewer_count then
    new.peak_viewer_count := new.current_viewer_count;
  end if;

  return new;
end;
$function$;

drop trigger if exists sync_live_broadcast_peak_viewer_count_on_live_broadcast
  on public.live_broadcast;
create trigger sync_live_broadcast_peak_viewer_count_on_live_broadcast
before insert or update of current_viewer_count, peak_viewer_count
on public.live_broadcast
for each row execute function public.sync_live_broadcast_peak_viewer_count();

revoke execute on function public.sync_live_broadcast_peak_viewer_count() from public;
revoke execute on function public.sync_live_broadcast_peak_viewer_count() from anon;
revoke execute on function public.sync_live_broadcast_peak_viewer_count() from authenticated;
grant execute on function public.sync_live_broadcast_peak_viewer_count() to service_role;

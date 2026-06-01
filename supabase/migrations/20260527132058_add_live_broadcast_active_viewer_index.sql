-- Align active live discovery index with /live Hero and list ordering.
create index if not exists live_broadcast_active_viewer_started_at_idx
  on public.live_broadcast using btree (current_viewer_count desc, started_at desc)
  where ended_at is null;

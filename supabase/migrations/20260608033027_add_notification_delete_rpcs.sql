-- 알림 삭제 RPC: 서버 액션(admin client) 경유, 본인 알림만 삭제 가능

create or replace function public.delete_all_notifications(p_actor_user_id uuid)
returns void language plpgsql security definer set search_path to '' as $function$
begin
  delete from public.notification where recipient_id = p_actor_user_id;
end;
$function$;

create or replace function public.delete_notification(p_actor_user_id uuid, p_notification_id uuid)
returns void language plpgsql security definer set search_path to '' as $function$
begin
  delete from public.notification
  where id = p_notification_id and recipient_id = p_actor_user_id;
end;
$function$;

revoke all on function public.delete_all_notifications(uuid) from public, anon, authenticated;
revoke all on function public.delete_notification(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_all_notifications(uuid) to service_role;
grant execute on function public.delete_notification(uuid, uuid) to service_role;

ALTER FUNCTION public.update_member_count()
  SET search_path = public;

ALTER FUNCTION public.get_rooms_by_tab(uuid, text)
  SET search_path = public;

CREATE INDEX IF NOT EXISTS chat_room_member_user_id_idx
  ON public.chat_room_member (user_id);

CREATE INDEX IF NOT EXISTS message_chat_room_id_idx
  ON public.message (chat_room_id);

CREATE INDEX IF NOT EXISTS message_user_id_idx
  ON public.message (user_id);

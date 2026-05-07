-- 방장이 아닌 멤버가 chat_room_member 행을 삭제해 채팅방을 나감 (트리거로 current_member 갱신)
CREATE OR REPLACE FUNCTION public.leave_chat_room(p_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  room_owner uuid;
  deleted_rows integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT r.owner_id INTO room_owner
  FROM public.chat_room r
  WHERE r.id = p_room_id;

  IF room_owner IS NULL THEN
    RAISE EXCEPTION 'room not found';
  END IF;

  IF room_owner = uid THEN
    RAISE EXCEPTION 'owner cannot leave';
  END IF;

  DELETE FROM public.chat_room_member m
  WHERE m.chat_room_id = p_room_id
    AND m.user_id = uid;

  GET DIAGNOSTICS deleted_rows = ROW_COUNT;

  IF deleted_rows = 0 THEN
    RAISE EXCEPTION 'not a member';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.leave_chat_room(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_chat_room(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_chat_room(uuid) TO service_role;

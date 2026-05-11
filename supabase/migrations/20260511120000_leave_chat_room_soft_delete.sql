-- leave_chat_room: 멤버 행은 유지하고 last_joined_at만 NULL로 두어 나가기 처리 (soft leave)
-- current_member 갱신은 기존 트리거/정책에 맞게 DB에서 유지한다.
CREATE OR REPLACE FUNCTION public.leave_chat_room(p_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  room_owner uuid;
  updated_rows integer;
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

  UPDATE public.chat_room_member m
  SET last_joined_at = NULL
  WHERE m.chat_room_id = p_room_id
    AND m.user_id = uid
    AND m.last_joined_at IS NOT NULL;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows = 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.chat_room_member m
      WHERE m.chat_room_id = p_room_id AND m.user_id = uid
    ) THEN
      RAISE EXCEPTION 'not a member';
    END IF;
    RETURN;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.leave_chat_room(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_chat_room(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_chat_room(uuid) TO service_role;

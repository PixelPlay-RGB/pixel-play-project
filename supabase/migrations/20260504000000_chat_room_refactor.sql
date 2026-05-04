TRUNCATE TABLE public.message, public.chat_room_member, public.chat_room RESTART IDENTITY CASCADE;

ALTER TABLE public.chat_room_member
  DROP COLUMN IF EXISTS status;

DROP TYPE IF EXISTS public.membership_status;

ALTER TABLE public.chat_room_member
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

ALTER TABLE public.chat_room
  ADD COLUMN IF NOT EXISTS current_member integer NOT NULL DEFAULT 0;

UPDATE public.chat_room AS room
SET current_member = COALESCE(member_counts.count, 0)
FROM (
  SELECT chat_room_id, COUNT(*)::integer AS count
  FROM public.chat_room_member
  WHERE is_banned = false
  GROUP BY chat_room_id
) AS member_counts
WHERE room.id = member_counts.chat_room_id;

UPDATE public.chat_room
SET current_member = 0
WHERE current_member IS NULL;

ALTER TABLE public.chat_room
  DROP CONSTRAINT IF EXISTS chatroom_current_member_non_negative;

ALTER TABLE public.chat_room
  DROP CONSTRAINT IF EXISTS chat_room_current_member_non_negative;

ALTER TABLE public.chat_room
  ADD CONSTRAINT chat_room_current_member_non_negative
  CHECK (current_member >= 0);

ALTER TABLE public.chat_room_member
  DROP CONSTRAINT IF EXISTS chatroommember_chat_room_id_user_id_key;

ALTER TABLE public.chat_room_member
  DROP CONSTRAINT IF EXISTS chat_room_member_chat_room_id_user_id_key;

ALTER TABLE public.chat_room_member
  ADD CONSTRAINT chat_room_member_chat_room_id_user_id_key
  UNIQUE (chat_room_id, user_id);

DROP TRIGGER IF EXISTS trigger_update_member_count ON public.chat_room_member;
DROP FUNCTION IF EXISTS public.update_member_count();

CREATE OR REPLACE FUNCTION public.update_member_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_banned = false THEN
      UPDATE public.chat_room
      SET current_member = current_member + 1
      WHERE id = NEW.chat_room_id;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.is_banned = false THEN
      UPDATE public.chat_room
      SET current_member = GREATEST(current_member - 1, 0)
      WHERE id = OLD.chat_room_id;
    END IF;

    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.chat_room_id <> NEW.chat_room_id THEN
      IF OLD.is_banned = false THEN
        UPDATE public.chat_room
        SET current_member = GREATEST(current_member - 1, 0)
        WHERE id = OLD.chat_room_id;
      END IF;

      IF NEW.is_banned = false THEN
        UPDATE public.chat_room
        SET current_member = current_member + 1
        WHERE id = NEW.chat_room_id;
      END IF;
    ELSIF OLD.is_banned = false AND NEW.is_banned = true THEN
      UPDATE public.chat_room
      SET current_member = GREATEST(current_member - 1, 0)
      WHERE id = OLD.chat_room_id;
    ELSIF OLD.is_banned = true AND NEW.is_banned = false THEN
      UPDATE public.chat_room
      SET current_member = current_member + 1
      WHERE id = NEW.chat_room_id;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_member_count
AFTER INSERT OR DELETE OR UPDATE OF is_banned, chat_room_id ON public.chat_room_member
FOR EACH ROW
EXECUTE FUNCTION public.update_member_count();

DROP FUNCTION IF EXISTS public.get_rooms_by_tab(uuid, text);

CREATE OR REPLACE FUNCTION public.get_rooms_by_tab(p_user_id uuid, p_tab_type text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  max_capacity integer,
  current_member integer,
  owner_id uuid,
  owner_nickname text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF upper(p_tab_type) = 'OWNED' THEN
    RETURN QUERY
    SELECT
      room.id,
      room.title,
      room.description,
      room.max_capacity::integer,
      room.current_member,
      room.owner_id,
      owner.nickname,
      room.created_at
    FROM public.chat_room AS room
    JOIN public."user" AS owner ON owner.id = room.owner_id
    WHERE room.owner_id = p_user_id
    ORDER BY room.created_at DESC;
  ELSIF upper(p_tab_type) = 'JOINED' THEN
    RETURN QUERY
    SELECT
      room.id,
      room.title,
      room.description,
      room.max_capacity::integer,
      room.current_member,
      room.owner_id,
      owner.nickname,
      room.created_at
    FROM public.chat_room AS room
    JOIN public."user" AS owner ON owner.id = room.owner_id
    JOIN public.chat_room_member AS member ON member.chat_room_id = room.id
    WHERE member.user_id = p_user_id
      AND member.is_banned = false
    ORDER BY room.created_at DESC;
  ELSIF upper(p_tab_type) = 'NOT_JOINED' THEN
    RETURN QUERY
    SELECT
      room.id,
      room.title,
      room.description,
      room.max_capacity::integer,
      room.current_member,
      room.owner_id,
      owner.nickname,
      room.created_at
    FROM public.chat_room AS room
    JOIN public."user" AS owner ON owner.id = room.owner_id
    LEFT JOIN public.chat_room_member AS member
      ON member.chat_room_id = room.id
     AND member.user_id = p_user_id
    WHERE room.owner_id <> p_user_id
      AND member.user_id IS NULL
    ORDER BY room.created_at DESC;
  END IF;
END;
$$;

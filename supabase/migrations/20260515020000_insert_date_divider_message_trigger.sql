-- 채팅방 날짜 구분 시스템 메시지 자동 삽입 Trigger
-- text 메시지 INSERT 시 해당 날짜(KST)의 첫 번째 메시지인지 확인,
-- 첫 메시지라면 "📅 YYYY년 MM월 DD일 요일" 형태의 system 메시지를 1ms 앞에 삽입

CREATE OR REPLACE FUNCTION public.insert_date_divider_message()
RETURNS TRIGGER AS $$
DECLARE
  v_kst_date        date;
  v_dow             text;
  v_content         text;
  v_prev_text_today integer;
BEGIN
  -- system 메시지 INSERT 시 재귀 차단
  IF NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  -- UTC → KST 변환
  v_kst_date := (NEW.created_at AT TIME ZONE 'Asia/Seoul')::date;

  -- 같은 채팅방·같은 날짜(KST)의 다른 text 메시지가 이미 있는지 확인
  SELECT COUNT(*) INTO v_prev_text_today
  FROM public.message
  WHERE chat_room_id = NEW.chat_room_id
    AND message_type = 'text'
    AND (created_at AT TIME ZONE 'Asia/Seoul')::date = v_kst_date
    AND id != NEW.id;

  -- 오늘 첫 text 메시지인 경우에만 날짜 구분선 삽입
  IF v_prev_text_today = 0 THEN
    v_dow := CASE EXTRACT(DOW FROM v_kst_date)
      WHEN 0 THEN '일요일'
      WHEN 1 THEN '월요일'
      WHEN 2 THEN '화요일'
      WHEN 3 THEN '수요일'
      WHEN 4 THEN '목요일'
      WHEN 5 THEN '금요일'
      WHEN 6 THEN '토요일'
    END;

    v_content := '📅 ' || to_char(v_kst_date, 'YYYY"년" MM"월" DD"일" ') || v_dow;

    INSERT INTO public.message (chat_room_id, user_id, content, message_type, created_at)
    VALUES (
      NEW.chat_room_id,
      NEW.user_id,
      v_content,
      'system',
      NEW.created_at - interval '1 millisecond'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER trigger_insert_date_divider_message
  AFTER INSERT ON public.message
  FOR EACH ROW
  EXECUTE FUNCTION public.insert_date_divider_message();

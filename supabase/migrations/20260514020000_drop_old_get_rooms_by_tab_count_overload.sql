-- 파라미터 3개짜리 구버전 오버로드 제거
-- 현재 운용 버전: get_rooms_by_tab_count(uuid, text, text, integer, integer)
DROP FUNCTION IF EXISTS public.get_rooms_by_tab_count(uuid, text, text);

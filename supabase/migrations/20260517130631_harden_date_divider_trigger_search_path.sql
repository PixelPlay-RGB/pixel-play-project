-- 날짜 구분 trigger helper의 security definer search_path를 제한한다.

alter function public.insert_date_divider_message() set search_path to '';

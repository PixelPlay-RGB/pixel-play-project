-- 랜딩 페이지 제거(인덱스=라이브 목록 전환) 후 사용처가 없는 랜딩 스냅샷 RPC를 정리한다.
drop function if exists public.get_landing_snapshot();

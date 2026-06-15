-- 클립 조회수 어뷰징 방지 — 뷰어별 1회만 카운트하는 dedup 테이블 + RPC 교체.
-- 기존 increment_live_clip_view_count(uuid)는 단순 +1이라 새로고침·반복 호출로 부풀리기가
-- 가능했다. (clip_id, viewer_key) 유니크로 첫 조회에만 카운트한다.
-- viewer_key = 로그인 유저 'u:{uid}' / 익명 'a:{cookie_uuid}' (서버 액션에서 결정).

create table if not exists public.live_clip_view (
  clip_id uuid not null references public.live_clip(id) on delete cascade,
  viewer_key text not null,
  created_at timestamptz not null default now(),
  primary key (clip_id, viewer_key)
);

-- 서비스 롤(RPC) 전용 — 클라이언트 직접 접근 없음.
alter table public.live_clip_view enable row level security;
revoke all on table public.live_clip_view from public, anon, authenticated;

-- 단순 +1 버전 제거 후, 뷰어 키로 dedup하는 버전으로 교체.
drop function if exists public.increment_live_clip_view_count(uuid);

create or replace function public.increment_live_clip_view_count(p_clip_id uuid, p_viewer_key text)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if p_viewer_key is null or length(p_viewer_key) = 0 then
    return;
  end if;

  -- 같은 (클립, 뷰어)면 무시 — 첫 조회에만 카운트한다.
  insert into public.live_clip_view (clip_id, viewer_key)
  values (p_clip_id, p_viewer_key)
  on conflict (clip_id, viewer_key) do nothing;

  -- 위 INSERT가 실제로 행을 넣었을 때(첫 조회)만 조회수를 올린다.
  if found then
    update public.live_clip
    set view_count = view_count + 1
    where id = p_clip_id
      and status = 'ready'::public.live_clip_status;
  end if;
end;
$$;

revoke execute on function public.increment_live_clip_view_count(uuid, text)
  from public, anon, authenticated;
grant execute on function public.increment_live_clip_view_count(uuid, text) to service_role;

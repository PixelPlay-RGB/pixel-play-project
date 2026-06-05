-- 단일 user-media 버킷으로 통합(기존 profiles/channel-media/live-thumbnails를 점진 이전).
-- 경로 구조: user-media/{userId}/{avatar|banner|live-thumbnail|community}/...
-- 유저 폴더가 최상위라 RLS·유저 삭제 시 정리가 단순해진다.

insert into storage.buckets (id, name, public)
values ('user-media', 'user-media', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

-- 공개 버킷이라 이미지 표시는 공개 CDN URL로 처리된다(SELECT 정책 불필요).
-- list()로 전체 파일이 열거되지 않도록 SELECT는 인증 유저의 본인 폴더로만 제한한다.
drop policy if exists "user_media 본인 폴더 조회" on storage.objects;
create policy "user_media 본인 폴더 조회"
on storage.objects for select
to authenticated
using (
  bucket_id = 'user-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "user_media 본인 폴더 업로드" on storage.objects;
create policy "user_media 본인 폴더 업로드"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'user-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "user_media 본인 폴더 수정" on storage.objects;
create policy "user_media 본인 폴더 수정"
on storage.objects for update
to authenticated
using (
  bucket_id = 'user-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "user_media 본인 폴더 삭제" on storage.objects;
create policy "user_media 본인 폴더 삭제"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'user-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

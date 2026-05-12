# Issue #37 채팅방 멤버 관리 체크리스트

- [x] 브랜치와 기존 변경사항 확인
- [x] AGENTS.md와 컨벤션 문서 재확인
- [x] DB 함수, 트리거, RLS, Realtime publication 현황 재확인
- [x] Supabase SQL로 message_type ENUM과 message.message_type 컬럼 추가
- [x] Supabase SQL로 강퇴, 권한 위임 RPC 추가
- [x] npm run types로 DB 타입 갱신
- [x] 채팅방 멤버 서버 액션 추가
- [x] chat_room_member Realtime hook 추가
- [x] 참여자 목록 active member 조회 기준 보정
- [x] 참여자 Popover Menu와 AlertDialog UI 추가
- [x] 강퇴당한 유저 안내 Dialog 추가
- [x] 시스템 메시지 렌더링 추가
- [x] ChatRoom에 멤버 액션, Realtime, Dialog 연결
- [x] query invalidate 범위 점검
- [x] npm run build 실행
- [x] 최종 diff와 이슈 체크박스 점검

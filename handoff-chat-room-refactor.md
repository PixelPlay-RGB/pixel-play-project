# PixelPlay 리팩토링 핸드오프

## 현재 브랜치

- 브랜치: `refactor/project-wide/#65`
- 최신 확인 커밋: `4f766b8 refactor(#65): 채팅방 상세 구조 분리`
- 기준 일자: 2026-05-16

## 지금까지 완료한 작업

### 앱 메시지와 에러 처리 정리

- 사용자 노출 toast 메시지를 `APP_MESSAGE_CODE`와 `APP_MESSAGE` 기반으로 정리했습니다.
- DB/RPC/Auth 원본 에러는 사용자에게 직접 노출하지 않고 `console.error`에 남기는 방향으로 정리했습니다.
- `AppActionResult.message`를 제거하고 필드 검증 메시지는 `FieldActionResult.fieldMessage`로 분리했습니다.
- `APP_MESSAGE_CODE`가 `APP_MESSAGE` 구조와 맞는지 타입 레벨 검증을 추가했습니다.
- 관련 커밋입니다.
  - `9b7ab0a refactor(#65): 앱 메시지 에러 처리 1차 정리`
  - `d1cabaa refactor(#65): 액션 결과 메시지 타입 분리`
  - `6f4183c refactor(#65): 앱 메시지 구조 검증 추가`

### CSS 컨벤션 정리

- 글로벌 CSS와 앱 도메인 컴포넌트의 주요 CSS 컨벤션 정리를 완료했습니다.
- `text-[10px]`, `text-[12px]` 계열은 `text-xs` 방향으로 정리했습니다.
- `capacityPercent` 기반 progress width처럼 런타임 값이 필요한 동적 style은 유지했습니다.
- `emoji-picker-react`는 라이브러리 방향에 맞춰 CSS 변수 기반 전역 selector로 관리하는 방향을 유지했습니다.

### ChatRoom 라우트와 구조 분리

- 기존 상세 라우트 `src/app/chat/[room-id]`를 `src/app/chat-room/[roomId]`로 변경했습니다.
- 동적 라우트 세그먼트의 대괄호 내부 값은 `params` 키가 되므로 파일/폴더 kebab-case가 아니라 변수 camelCase 예외로 판단했습니다.
- 채팅방 목록 컴포넌트는 `src/components/chat-room-list`로 이동했습니다.
- 채팅방 상세 컴포넌트는 `src/components/chat-room`으로 이동했습니다.
- 기존 `src/components/member`와 `src/components/message`는 채팅방 상세 종속으로 보고 `src/components/chat-room/member`, `src/components/chat-room/message`로 이동했습니다.
- `ChatRoom`은 상태 게이트와 화면 조립만 담당하도록 줄였습니다.
- 새로 분리된 상세 컴포넌트입니다.
  - `src/components/chat-room/chat-room-header.tsx`
  - `src/components/chat-room/chat-room-member-sidebar.tsx`
  - `src/components/chat-room/chat-room-member-sheet.tsx`
  - `src/components/chat-room/chat-room-message-section.tsx`
  - `src/components/chat-room/chat-room-dialogs.tsx`
  - `src/components/chat-room/chat-room-error.tsx`
- `MemberList`는 `roomId`만 받고 내부에서 `useUser`, `useRoom`, `useRoomMembers`를 직접 호출하도록 props를 줄였습니다.
- 현재 유저의 `chat_room_member` row 조회는 `useCurrentChatRoomMemberRow`로 분리했습니다.
- realtime 무효화 책임은 `useChatRoomMemberRealtimeInvalidation`으로 분리했습니다.
- 기존 `useChatRoomMemberRealtime`는 제거했습니다.
- 채팅방 카드 링크는 `/chat/${id}`에서 `/chat-room/${id}`로 변경했습니다.

## 완료 검증

마지막 구조 분리 작업 후 아래 검증을 통과했습니다.

```txt
npm.cmd run format
npm.cmd run format:check
npm.cmd run lint
npm.cmd run build
```

`next build` 결과 라우트 목록에 `ƒ /chat-room/[roomId]`가 정상 생성됐습니다.

## 다음에 해야 할 일

1. 브랜치를 원격에 push하고 PR 기준 branch가 `dev`인지 다시 확인해야 합니다.
2. 실제 로그인 세션으로 브라우저 QA를 해야 합니다.
   - 메인 채팅방 목록에서 카드 클릭 시 `/chat-room/[roomId]`로 이동되는지 확인합니다.
   - 참여 중인 채팅방의 메시지 목록과 입력창이 정상 표시되는지 확인합니다.
   - 모바일 참여자 Sheet가 열리고 참여자 관리 메뉴가 정상 동작하는지 확인합니다.
   - 데스크톱 참여자 사이드바가 정상 표시되는지 확인합니다.
   - 미참여 방 진입 시 참여 Dialog가 정상 표시되는지 확인합니다.
   - 강퇴 상태 방 진입 시 강퇴 Dialog와 입력 잠금이 유지되는지 확인합니다.
   - 방장 나가기 정책이 기존처럼 동작하는지 확인합니다.
3. `/chat/[roomId]` 구 라우트를 완전히 제거한 상태이므로, 외부 공유 링크나 기존 북마크 호환이 필요하면 redirect route를 별도로 추가할지 결정해야 합니다.
4. `src/app/chat-room/[roomId]`처럼 동적 세그먼트는 camelCase 예외라는 내용을 `.agents/code-convention/SKILLS.md`에 명시할지 결정해야 합니다.
5. 다음 리팩토링 후보는 DB/RPC 계층입니다.
   - `join_chat_room`, `leave_chat_room`, `kick_chat_room_member`, `transfer_chat_room_owner`의 책임과 반환 구조를 재검토합니다.
   - `last_joined_at`, `last_read_at`, `is_banned`, 정원 초과, 방장 나가기 정책을 DB/RPC 기준으로 다시 정리합니다.
   - 단, 이 작업은 SQL migration과 Supabase 타입 갱신이 필요한 별도 리팩토링으로 분리하는 것이 좋습니다.

## 주의할 점

- 사용자에게 노출되는 toast/error 문구는 직접 문자열 대신 `APP_MESSAGE_CODE`를 사용해야 합니다.
- Supabase/Auth/DB 원본 에러는 사용자에게 직접 보여주지 말고 `console.error`로만 남겨야 합니다.
- `QUERY_KEYS.chat`에 없는 임시 query key를 컴포넌트나 hook 내부에서 만들지 말아야 합니다.
- `as unknown as`로 Supabase select 타입을 덮지 말고 query shape와 타입을 맞춰야 합니다.
- DB에서 처리할 수 있는 `is_banned`, `last_joined_at` 조건은 클라이언트 filter로 옮기지 말아야 합니다.

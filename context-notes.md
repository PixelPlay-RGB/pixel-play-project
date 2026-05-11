# #42 에러 메시지 상수화 및 권한 상태 에러 UI 작업 노트

- 메시지 데이터는 `APP_MESSAGE` 상수로 관리한다.
- 메시지 타입은 `src/types/app-message.ts`에 둔다.
- toast 전용 이름 대신 화면 에러 UI에서도 사용할 수 있도록 `app-message` 이름을 유지한다.
- action 결과는 기존 코드와의 단계적 호환을 위해 `code?: AppMessageCode` 형태로 시작한다.
- Zod validation 문구는 이번 1차 작업 범위에서 제외한다.
- `src/components/chat/chat-room.tsx`의 깨진 `disabledHint` 문구는 메시지 상수 연결 과정에서 함께 정상화한다.
- 빌드 중 기존 `ChatRoomCounts` 타입 re-export 누락이 발견되어 최소 수정으로 `use-chat-room-counts.ts`에서 타입을 다시 export한다.

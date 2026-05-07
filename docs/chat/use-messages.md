# use-messages 문서

## 파일 경로
- 현재 파일 없음 (예정 경로: `src/hook/use-messages.ts`)

## 파일 설명
- 현재 프로젝트에는 `use-messages` 훅이 아직 구현되지 않았어.
- 메시지 조회/추가/실시간 구독 로직을 `chat-room.tsx`에서 직접 처리 중이야.
- 추후 Supabase 연동 시 메시지 상태 로직을 분리하는 용도로 만드는 걸 권장해.

## Props 타입 설명 (예정)
- 입력
  - `roomId: string`
  - `currentUserId: string`
- 반환
  - `messages: Message[]`
  - `draft: string`
  - `setDraft: (value: string) => void`
  - `sendMessage: () => Promise<void> | void`

## 주요 함수/훅 설명 (예정)
- `useQuery` - 초기 메시지 조회.
- `useMutation` - 메시지 전송.
- Realtime subscribe/unsubscribe - 실시간 메시지 반영.

## 사용 예시 (예정)
```tsx
const { messages, draft, setDraft, sendMessage } = useMessages({
  roomId,
  currentUserId,
})
```

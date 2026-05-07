# chat-room 문서

## 파일 경로
- `src/component/chat/chat-room.tsx`

## 파일 설명
- 채팅 화면의 최상위 클라이언트 컴포넌트야.
- 참여자 목록(`MemberList`)과 채팅 영역(`MessageList`, `MessageInput`)을 한 화면 레이아웃으로 조합해.
- 현재는 Supabase 연동 없이 더미 방/멤버/메시지 데이터를 생성해서 UI를 보여줘.

## Props 타입 설명
- `Props`
  - `roomId: string` - 현재 채팅방 식별자.

## 주요 함수/훅 설명
- `buildDummyRoom(roomId)` - 채팅방 더미 정보 생성.
- `buildDummyMembers(roomId)` - 참여자 더미 목록 생성.
- `buildInitialMessages(roomId)` - 초기 메시지 더미 목록 생성.
- `useState` - 메시지 배열, 입력값 상태 관리.
- `handleSend()` - 입력값 검증 후 메시지를 로컬 상태에 추가.
- `useMemo` - 방 정보/멤버/참여자 수 포맷 계산 최적화.

## 사용 예시
```tsx
import { ChatRoom } from "@/component/chat/chat-room"

export default function Example() {
  return <ChatRoom roomId="room-123" />
}
```

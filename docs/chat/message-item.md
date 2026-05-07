# message-item 문서

## 파일 경로
- `src/component/chat/message-item.tsx`

## 파일 설명
- 단일 메시지 버블 UI를 렌더링하는 컴포넌트야.
- 내 메시지(`isOwn`)면 오른쪽 정렬/강조 색상, 상대 메시지면 아바타+닉네임+버블 형태로 보여줘.

## Props 타입 설명
- `Props`
  - `message: Message` - 렌더링할 메시지 데이터.
  - `displayName: string` - 상대 표시 이름(닉네임).
  - `isOwn: boolean` - 내 메시지 여부.

## 주요 함수/훅 설명
- `initials = displayName.slice(0, 2)` - 아바타 폴백용 이니셜 생성.
- `if (isOwn)` 분기 - 메시지 타입별 레이아웃/스타일 분리.

## 사용 예시
```tsx
<MessageItem
  message={message}
  displayName="스트리머"
  isOwn={message.userId === currentUserId}
/>
```

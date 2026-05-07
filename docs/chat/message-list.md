# message-list 문서

## 파일 경로
- `src/component/chat/message-list.tsx`

## 파일 설명
- 채팅 메시지 목록을 스크롤 영역에 렌더링하는 컴포넌트야.
- 메시지가 바뀔 때마다 목록 맨 아래로 자동 이동해서 최신 메시지를 바로 보게 해.

## Props 타입 설명
- `Props`
  - `messages: Message[]` - 렌더링할 메시지 배열.
  - `displayNameByUserId: Record<string, string>` - 유저 ID를 표시 이름으로 변환하는 맵.
  - `currentUserId: string` - 내 메시지 여부를 판단할 현재 사용자 ID.

## 주요 함수/훅 설명
- `useRef(bottomRef)` - 스크롤 기준점(하단 앵커) 참조.
- `useEffect([messages])` - 메시지 변경 시 `scrollIntoView`로 최신 메시지 위치로 이동.
- `messages.map()` - 각 메시지를 `MessageItem`으로 렌더링.

## 사용 예시
```tsx
<MessageList
  messages={messages}
  displayNameByUserId={displayNameByUserId}
  currentUserId="userSelf"
/>
```

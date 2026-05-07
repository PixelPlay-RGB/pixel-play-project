# message-input 문서

## 파일 경로
- `src/component/chat/message-input.tsx`

## 파일 설명
- 채팅 입력창과 전송 버튼 UI를 담당하는 컴포넌트야.
- Enter 키(Shift 제외) 또는 버튼 클릭으로 `onSend`를 호출해.

## Props 타입 설명
- `Props`
  - `draft: string` - 현재 입력값.
  - `onDraftChange: (value: string) => void` - 입력값 변경 핸들러.
  - `onSend: () => void` - 메시지 전송 핸들러.

## 주요 함수/훅 설명
- `onKeyDown` - Enter 입력 시 기본 동작을 막고 전송 트리거.
- `onChange` - 입력값을 상위 상태로 전달.

## 사용 예시
```tsx
<MessageInput
  draft={draft}
  onDraftChange={setDraft}
  onSend={handleSend}
/>
```

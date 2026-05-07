# member-list 문서

## 파일 경로
- `src/component/chat/member-list.tsx`

## 파일 설명
- 채팅방 참여자 패널 전체를 렌더링하는 컴포넌트야.
- 상단 제목에 참여자 수를 표시하고, 본문에서 `MemberItem` 목록을 스크롤 가능하게 보여줘.

## Props 타입 설명
- `Props`
  - `members: RoomMember[]` - 참여자 목록 데이터.

## 주요 함수/훅 설명
- `countLabel` - `members.length`를 한국어 로케일 문자열로 포맷.
- `members.map()` - 각 참여자를 `MemberItem`으로 렌더링.

## 사용 예시
```tsx
<MemberList members={members} />
```

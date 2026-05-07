# member-item 문서

## 파일 경로
- `src/component/chat/member-item.tsx`

## 파일 설명
- 참여자 1명의 아바타와 아이디를 표시하는 컴포넌트야.
- 이름 앞 2글자를 `AvatarFallback`로 사용해서 이미지가 없어도 식별 가능하게 해.

## Props 타입 설명
- `Props`
  - `member: RoomMember` - 단일 참여자 데이터.

## 주요 함수/훅 설명
- `initials = member.name.slice(0, 2)` - 폴백 텍스트 생성.

## 사용 예시
```tsx
<MemberItem member={member} />
```

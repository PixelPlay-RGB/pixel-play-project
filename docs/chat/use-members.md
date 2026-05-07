# use-members 문서

## 파일 경로
- 현재 파일 없음 (예정 경로: `src/hook/use-members.ts`)

## 파일 설명
- 현재 프로젝트에는 `use-members` 훅이 아직 구현되지 않았어.
- 멤버 목록 데이터는 `chat-room.tsx`의 더미 생성 함수에서 직접 만들고 있어.
- 추후 Supabase 연동 시 참여자 목록 조회/입장/퇴장 이벤트를 분리 관리하는 훅으로 확장 가능해.

## Props 타입 설명 (예정)
- 입력
  - `roomId: string`
- 반환
  - `members: RoomMember[]`
  - `isLoading: boolean`
  - `refreshMembers: () => Promise<void> | void`

## 주요 함수/훅 설명 (예정)
- `useQuery` - 참여자 목록 조회.
- Realtime presence subscribe - 입장/퇴장 반영.

## 사용 예시 (예정)
```tsx
const { members, isLoading } = useMembers({ roomId })
```

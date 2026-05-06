# 아키텍처 및 관심사 분리 컨벤션 (SRP)

이 문서는 PixelPlay 프로젝트의 **단일 책임 원칙(Single Responsibility Principle)** 준수를 위한 가이드라인입니다.

## 1. 계층별 역할 정의

| 계층 | 위치 | 주요 역할 | 비고 |
|------|------|-----------|------|
| **UI Components** | `src/components` | 데이터 표시 및 사용자 인터페이스 렌더링 | 로직 최소화 (Presentational) |
| **Hooks** | `src/hooks` | 복잡한 UI 상태 관리 및 데이터 페칭 로직 | `useQuery`, `useMutation` 등 활용 |
| **Server Actions** | `src/actions` | 데이터 변경(Mutation), DB 접근, 외부 API 통신 | `'use server'` 지시어 필수 |
| **Stores** | `src/stores` | 전역 상태 관리 (Zustand) | 인증 상태, 채팅방 선택 정보 등 |
| **Services/Lib** | `src/lib` | 외부 SDK 설정 (Supabase) 및 핵심 비즈니스 유틸 | 인스턴스화 및 공통 로직 |

---

## 2. SRP 구현 가이드라인

### [1] UI 컴포넌트
- 컴포넌트는 오직 "어떻게 보이는가"에 집중합니다.
- 복잡한 데이터 처리나 상태 전환 로직은 커스텀 훅으로 추출합니다.
- 가급적 하나의 파일에는 하나의 컴포넌트만 정의합니다.

### [2] Hooks
- UI 로직을 캡슐화하여 재사용성을 높입니다.
- 특정 컴포넌트에 종속되지 않도록 일반화하여 설계합니다.

### [3] Server Actions
- 클라이언트 로직이 포함되지 않도록 주의합니다.
- 성공/실패 여부를 일관된 포맷(`{ data, error }`)으로 반환합니다.

---

## 3. 코드 분리 예시

### Bad (관심사 혼재)
```typescript
// components/ChatRoom.tsx 내부
const handleJoin = async () => {
  setLoading(true);
  const { error } = await supabase.from('rooms').insert(...); // 직접 DB 접근 (X)
  if (error) alert(error.message);
  setLoading(false);
}
```

### Good (SRP 준수)
1. **Action**: `src/actions/chat-room.ts`에서 DB 처리 담당.
2. **Hook**: `src/hooks/use-join-room.ts`에서 상태 관리 및 Action 호출.
3. **Component**: 버튼 클릭 시 Hook의 함수만 호출.

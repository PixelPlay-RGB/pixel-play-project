# 코드 컨벤션

## 네이밍 규칙

| 대상            | 규칙             | 예시                                         |
| --------------- | ---------------- | -------------------------------------------- |
| 변수, 함수      | camelCase        | `userName`, `getUserData()`, `isLoading`     |
| 파일, 폴더 이름 | kebab-case       | `user-card.ts`, `api-client/`, `use-auth.ts` |
| 컴포넌트 이름   | PascalCase       | `UserCard`, `LoginForm`, `DashboardLayout`   |
| 상수            | UPPER_SNAKE_CASE | `MEMBER_LIST`                                |
| 타입/인터페이스 | PascalCase       | `interface Props`, `type User`               |

## 예외

- **컴포넌트 파일**: 컴포넌트 이름은 PascalCase이지만, 파일 이름은 kebab-case로 작성한다.
  - ex) `UserCard` 컴포넌트 → `user-card.tsx`

## 훅 (Hooks)

- 파일 이름: kebab-case → `use-auth.ts`
- 훅 함수 이름: camelCase → `useAuth()`

### `useEffect` 내부 단일 상태 보정

- `useEffect`에서 조건에 따라 `useState` setter를 단일로 호출해 상태를 보정해야 할 때는 `react-hooks/set-state-in-effect` lint 규칙을 해당 줄에서 비활성화한다.
- 이 패턴은 선택 가능한 값이 탭, 권한, 옵션 변경으로 더 이상 유효하지 않을 때 기본값으로 되돌리는 경우에만 사용한다.

```tsx
useEffect(() => {
  if (!options.includes(value)) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(DEFAULT_VALUE);
  }
}, [value, options]);
```

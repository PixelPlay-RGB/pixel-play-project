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

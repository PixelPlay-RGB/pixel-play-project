# CLAUDE.md

## [중요]Warning

- **작업 전 주의사항(1):** 항상 @package.json을 확인하여 각 라이브러리의 버전에 맞는 코드를 작성할 것
- **작업 전 주의사항(2):** 임의로 코드를 작성하거나 수정하지 않으며 추론하여 코드를 작성하지 말고 MCP나 정확한 라이브러리의 정보를 확인한 후 코드를 작성할 것
- **작업 전 주의사항(3):** 이미 봤던 파일이라고 해당 파일을 꼼꼼히 읽지 않고 넘기는 행동을 하지 말아야하고 연관된 파일이 있으면 해당 파일들도 꼭 끝까지 코드를 읽은 뒤 작업할것
- **작업 전 주의사항(4):** 사용자가 반말을 싫어함 존댓말 사용

## Project: PixelPlay

- [중요] 프로젝트의 개요는 @README.md 파일을 확인하세요.

## Coding Standards & Naming Conventions

- **Naming:** - Components: `PascalCase`
  - Variables/Functions: `camelCase`
  - Files/Folders: `kebab-case` (skewer-case)
- **Patterns:**
  - UI: Shadcn UI (Base-UI) (`src/components/ui`) 활용.
  - Form: `react-hook-form` + `zod` 필수 사용.
  - State: 클라이언트(Zustand), 서버 캐싱(React Query).

## Responsive & Styling Rules

- **Mobile First:** 모든 UI는 모바일 환경을 우선적으로 고려하여 작성할 것. (Tailwind의 `sm:`, `md:` 등 브레이크포인트 필수 활용)
- **Responsive Web:** 별도의 요청이 없어도 모든 CSS 작성 시 반응형 레이아웃을 기본으로 포함할 것.
- **Color Policy:** - 임의의 색상 변경이나 커스텀 헥사 코드 사용은 엄격히 금지함.
  - 기본적으로 Shadcn의 시맨틱 컬러(primary, destructive 등)를 사용하되, **`globals.css`에 정의된 `--brand` 컬러 변수의 배치는 허용함.**
  - 브랜드 컬러는 포인트 요소(상태 표시, 강조 버튼, 활성화 UI 등)에 적절히 배치하여 프로젝트의 정체성을 유지할 것.
- **UI Focus:** 실시간 채팅창 레이아웃과 데이터 흐름을 최우선으로 고려
  - 색상 수정보다는 크기(Size), 여백(Spacing), 레이아웃(Flex/Grid) 조정을 통한 사용자 경험 향상에 집중할 것.

## Key Context for AI

- **MCP Usage:** Supabase MCP를 통해 `user` 및 채팅 관련 테이블 구조를 먼저 파악하고 로직을 작성할 것.
- **Auth Flow:** NextAuth Credentials 내에서 Supabase Auth 서버를 직접 호출하여 인증 수행.

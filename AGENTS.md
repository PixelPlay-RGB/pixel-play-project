# PixelPlay Agent Guide

이 문서는 Codex/AI 에이전트가 PixelPlay 프로젝트에서 작업할 때 먼저 확인해야 하는 운영 규칙입니다. 자세한 제품/환경 설명은 [README.md](./README.md)를 기준으로 삼고, 팀 컨벤션은 `.agents` 하위 문서를 함께 참고합니다.

## 프로젝트 개요

- PixelPlay는 실시간 채팅 플랫폼으로 시작해 향후 라이브 스트리밍 서비스로 확장할 Next.js 웹 애플리케이션입니다.
- 주요 스택은 Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, shadcn `base-nova`, Base UI, Supabase Auth/Postgres/Realtime, TanStack Query v5, Zustand v5입니다.
- 인증은 Supabase Auth 단독으로 처리하며, `src/lib/supabase/proxy.ts`가 세션 검증과 라우트 가드를 담당합니다.
- 데이터 타입은 Supabase 스키마에서 생성된 `src/types/database.types.ts`를 기준으로 사용합니다.
- 채팅 실시간 기능은 Supabase Realtime의 Postgres Changes, Broadcast, Presence를 사용하는 방향입니다. 별도 Socket.IO 서버는 도입하지 않습니다.

## 참고 문서

- [중요] 사용자의 작업 환경 OS는 Windows 입니다.
- 프로젝트 실행, 환경 변수, 디렉토리 구조, DB 스키마: [README.md](./README.md)
- 코드 네이밍/파일 컨벤션: [.agents/code-convention/SKILLS.md](./.agents/code-convention/SKILLS.md)
- 커밋 메시지/브랜치 컨벤션: [.agents/git-convention/SKILLS.md](./.agents/git-convention/SKILLS.md)
- 디자인 컨벤션/컬러 시스템: [.agents/design-convention/SKILLS.md](./.agents/design-convention/SKILLS.md)
- 아키텍처/SRP 컨벤션: [.agents/code-convention/SRP_CONVENTION.md](./.agents/code-convention/SRP_CONVENTION.md)

## 작업 규칙

- **[절대 금지] 지시 사항 외 작업 금지**: 사용자의 명시적인 지시(Directive)가 있는 작업만 수행합니다. 제안이나 분석을 넘어서 실제 파일을 수정하거나 새로운 구현을 진행하는 행위는 **어떠한 경우에도** 허용되지 않습니다. 모든 구현 작업은 사용자의 개별 승인 후 명확한 지시가 있을 때만 시작합니다.
- **단일 책임 원칙 (SRP)**: 모든 컴포넌트, 함수, 클래스는 하나의 역할만 수행해야 합니다. 상세 내용은 [.agents/code-convention/SRP_CONVENTION.md](./.agents/code-convention/SRP_CONVENTION.md)를 따릅니다.
- **작업 완료 후 즉시 정지**: 요청받은 특정 지시사항이 완료되면 추가적인 제안이나 추측 없이 즉시 응답을 마무리하고 사용자의 다음 지시를 기다립니다.
- 기존 구조와 스타일을 우선합니다. 새 패턴을 만들기 전에 `src/components`, `src/hooks`, `src/actions`, `src/lib`, `src/stores`, `src/utils`의 기존 구현을 확인합니다.
- 컴포넌트 파일과 폴더명은 kebab-case, 컴포넌트/타입 이름은 PascalCase, 변수/함수/훅 이름은 camelCase를 사용합니다.
- shadcn/Base UI 컴포넌트는 `src/components/ui`의 로컬 래퍼를 우선 사용합니다. 직접 primitive를 추가할 때도 기존 UI 컴포넌트의 스타일과 접근성 패턴을 맞춥니다.
- Tailwind 색상은 하드코딩보다 `bg-brand`, `text-brand`, `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border` 같은 프로젝트 토큰을 우선 사용합니다.
- **모바일 우선 반응형(Mobile-First)** 디자인을 지향합니다. 기본 스타일은 모바일 기준으로 작성하고, `sm:`, `md:`, `lg:` 등의 Tailwind 접두사를 사용하여 점진적으로 데스크톱 레이아웃을 확장합니다.
- `cn` 유틸은 `@/lib/utils` 또는 기존 파일의 import 스타일을 따릅니다. 현재 유틸 실제 위치는 `src/lib/utils/index.ts`입니다.
- 환경 변수를 추가하거나 변경하면 `.env.example`과 `src/env.d.ts`를 함께 확인합니다.
- Supabase 스키마 변경이 있을 때만 `npm run types`로 `src/types/database.types.ts`를 갱신합니다. UI만 수정하는 작업에서는 타입 재생성을 피합니다.
- 사용자가 만든 변경사항을 되돌리지 않습니다. 작업 전후로 `git status --short`를 확인하고, 관련 없는 변경은 건드리지 않습니다.

## 검증 명령

- 개발 서버: `npm run dev`
- 프로덕션 빌드/타입 확인: `npm run build`
- Supabase 타입 재생성: `npm run types`

작업 범위가 작아도 UI/컴포넌트 변경은 가능하면 `npm run build`로 확인합니다.

## Git 규칙

- 커밋 메시지는 한글로 작성합니다.
- 커밋 타입은 `feat`, `fix`, `refactor`, `style`, `test`, `chore` 중에서 고릅니다.
- 형식 예시: `feat(#25): 유저의 로그인 기능 추가`
- 브랜치 예시: `feat/auth/25`
- 자세한 규칙은 [.agents/git-convention/SKILLS.md](./.agents/git-convention/SKILLS.md)를 따릅니다.

# pixel-play-project

실시간 채팅 웹 애플리케이션 (Next.js 16 + Supabase 기반). 향후 실시간 스트리밍 서비스까지 확장을 고려합니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router) · React 19 · TypeScript (strict)
- **Styling**: Tailwind CSS 4 · shadcn · Base UI
- **Auth / Realtime / DB**: Supabase (SSR + Realtime)
- **State**: Zustand (클라이언트 상태) · TanStack Query (서버 상태)
- **Form**: react-hook-form + zod
- **Theme**: next-themes (다크모드)
- **Formatter**: Prettier (+ Tailwind 플러그인)

## 요구사항

- Node.js 20 이상
- npm 10 이상
- Supabase 프로젝트 (URL, Publishable Key 발급)

## 초기 시작 가이드

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

루트의 `.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

`.env.local` 내용:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
NEXT_PUBLIC_SUPABASE_DB_PASSWORD=<your-db-password>
```

> 값은 Supabase 대시보드 → Project Settings → API / Database에서 확인할 수 있습니다.
> 환경 변수 키를 추가·변경할 때는 `env.d.ts`의 타입 선언도 함께 업데이트해야 합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 <http://localhost:3000> 접속. 인증 미들웨어에 의해 비로그인 상태면 `/auth/login`으로 리다이렉트됩니다.

## 자주 쓰는 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run format` | Prettier로 전체 포맷 정리 |
| `npm run format:check` | 포맷 위반 검사 (CI용) |

## 디렉토리 구조

```
src/
├── app/              # Next.js App Router (layout, page, api)
├── components/
│   ├── ui/           # shadcn/Base UI 컴포넌트
│   └── common/       # 공용 컴포넌트
├── hooks/            # 커스텀 훅 (useChat, useRealtime 등)
├── stores/           # Zustand 스토어
├── lib/              # Supabase 클라이언트, 유틸, 프로바이더
│   ├── client.ts     # 브라우저용 Supabase 클라이언트
│   ├── server.ts     # 서버 컴포넌트용 Supabase 클라이언트
│   ├── middleware.ts # 세션 갱신 + 인증 가드
│   ├── providers.tsx # QueryClient + Theme 프로바이더
│   └── utils.ts      # cn 등 유틸
├── types/            # 공용 TypeScript 타입
└── middleware.ts     # Next.js 미들웨어 엔트리 (updateSession 호출)
```

## 실시간 통신 방침

실시간 채팅은 이미 설치된 `@supabase/supabase-js`의 Realtime 기능을 사용합니다.

- Postgres Changes — DB 변경 구독
- Broadcast — 클라이언트 간 즉시 메시지
- Presence — 온라인/타이핑 상태

Socket.IO 등 별도 WebSocket 서버는 도입하지 않습니다.

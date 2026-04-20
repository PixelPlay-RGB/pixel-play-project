# PixelPlay

실시간 채팅 플랫폼으로 시작해 향후 **라이브 스트리밍 서비스**로 확장할 계획인 웹 애플리케이션입니다.  
Next.js 16 App Router + Supabase Realtime 기반으로 구축됩니다.

---

## 기술 스택

| 분류                | 기술                                                              |
| ------------------- | ----------------------------------------------------------------- |
| Framework           | Next.js 16 (App Router) · React 19 · TypeScript (strict)          |
| Styling             | Tailwind CSS 4 · shadcn (base-nova) · Base UI · lucide-react      |
| Auth                | NextAuth v4 · Supabase Auth (Credentials · Google · GitHub OAuth) |
| Database / Realtime | Supabase (Postgres + Realtime)                                    |
| Server State        | TanStack Query v5                                                 |
| Client State        | Zustand v5                                                        |
| Form / Validation   | react-hook-form v7 · Zod v4                                       |
| Theme               | next-themes (다크모드)                                            |
| Formatter           | Prettier + Tailwind 플러그인                                      |

---

## 시작하기 전에

아래 항목이 준비되어 있어야 합니다.

- **Node.js** 20 이상
- **npm** 10 이상
- **Supabase** 프로젝트 ([app.supabase.com](https://app.supabase.com))
- **Google OAuth** 앱 (Google Cloud Console)
- **GitHub OAuth** 앱 (GitHub → Settings → Developer settings → OAuth Apps)

---

## Tutorial

### 1단계 — 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/PixelPlay-RGB/pixel-play-project.git
cd pixel-play-project
npm install
```

---

### 2단계 — 환경 변수 설정

루트의 `.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

| 변수                                   | 설명                               |
| -------------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase 프로젝트 URL              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | anon (공개) 키                     |
| `NEXT_PUBLIC_SUPABASE_DB_PASSWORD`     | DB 비밀번호                        |
| `AUTH_SECRET`                          | NextAuth 서명 비밀키 (랜덤 문자열) |
| `AUTH_GOOGLE_CLIENT_ID`                | Google OAuth 클라이언트 ID         |
| `AUTH_GOOGLE_CLIENT_SECRET`            | Google OAuth 클라이언트 시크릿     |
| `AUTH_GITHUB_CLIENT_ID`                | GitHub OAuth App Client ID         |
| `AUTH_GITHUB_CLIENT_SECRET`            | GitHub OAuth App Client Secret     |

> 환경 변수 키를 추가·변경하면 `src/env.d.ts`의 타입 선언도 함께 수정해야 합니다.

---

### 3단계 — OAuth 공급자 콜백 URL 등록

#### Google

Google Cloud Console → 사용자 인증 정보 → OAuth 2.0 클라이언트 → **승인된 리디렉션 URI** 에 추가합니다.

```
http://localhost:3000/api/auth/callback/google   # 개발
https://<your-domain>/api/auth/callback/google   # 프로덕션
```

#### GitHub

GitHub → Developer settings → OAuth Apps → 앱 선택 → **Authorization callback URL** 에 입력합니다.

```
http://localhost:3000/api/auth/callback/github   # 개발
https://<your-domain>/api/auth/callback/github   # 프로덕션
```

---

### 4단계 — 개발 서버 실행

```bash
npm run dev
```

브라우저에서 <http://localhost:3000> 접속. 비로그인 상태면 `/auth/login`으로 자동 리다이렉트됩니다.

---

## 디렉토리 구조

```
src/
├── actions/              # Server Actions
│   └── auth.ts           # 회원가입 서버 액션 (Supabase Auth 연동)
├── app/                  # Next.js App Router
│   ├── api/auth/         # NextAuth 핸들러
│   ├── auth/
│   │   ├── login/        # 로그인 페이지 (서버 컴포넌트)
│   │   └── signup/       # 회원가입 페이지 (서버 컴포넌트)
│   ├── layout.tsx
│   └── page.tsx          # 인덱스 (비로그인 시 /auth/login 리다이렉트)
├── components/
│   ├── auth/
│   │   ├── login/        # LoginForm · OAuthButtons
│   │   ├── signup/       # SignupForm
│   │   └── login-button.tsx  # Header 로그인/로그아웃 버튼
│   ├── common/           # Header · ThemeToggleButton
│   └── ui/               # shadcn / Base UI 컴포넌트
├── hooks/                # 커스텀 훅
├── lib/
│   ├── supabase/         # client.ts · server.ts · proxy.ts
│   ├── zod/              # 폼 유효성 스키마
│   ├── providers.tsx     # QueryClient · Theme · Session 프로바이더
│   └── utils.ts          # cn 유틸
├── stores/               # Zustand 스토어
└── types/
    └── database.types.ts # Supabase 자동 생성 타입 (npm run types)
```

---

## 데이터베이스 스키마

### `user` 테이블

| 컬럼         | 타입          | 설명                       |
| ------------ | ------------- | -------------------------- |
| `id`         | uuid (PK)     | 자동 생성                  |
| `oauth_id`   | text (UNIQUE) | NextAuth 공급자 유저 ID    |
| `email`      | text          | 이메일                     |
| `name`       | text          | 이름                       |
| `birth`      | text          | 생년월일                   |
| `phone`      | text          | 휴대전화번호               |
| `gender`     | enum          | `male` · `female` · `none` |
| `created_at` | timestamptz   | 생성 시각                  |

> OAuth 로그인 사용자는 `oauth_id`, `email`, `name` 만 저장되고 나머지 필드는 null입니다.

### 타입 재생성

스키마 변경 후 아래 명령으로 `src/types/database.types.ts`를 갱신합니다.

```bash
npm run types
```

---

## 인증 구조

```
로그인 페이지 (서버 컴포넌트)
├── LoginForm (클라이언트) — react-hook-form + Zod
│   └── signIn("credentials", { email, password })  →  NextAuth
├── OAuthButtons (클라이언트)
│   ├── signIn("google")  →  Google OAuth
│   └── signIn("github")  →  GitHub OAuth
│
회원가입 페이지 (서버 컴포넌트)
└── SignupForm (클라이언트) — react-hook-form + Zod
    └── signUpAction()  →  Server Action  →  Supabase Auth
```

- 세션 전략: **JWT** (30일)
- OAuth 로그인 시 `signIn` 콜백에서 Supabase `user` 테이블에 자동 동기화

---

## 실시간 통신 방침

채팅 실시간 기능은 `@supabase/supabase-js`의 Realtime을 활용합니다.

- **Postgres Changes** — DB 변경 이벤트 구독
- **Broadcast** — 클라이언트 간 즉시 메시지 전송
- **Presence** — 온라인 상태 · 타이핑 인디케이터

Socket.IO 등 별도 WebSocket 서버는 도입하지 않습니다.

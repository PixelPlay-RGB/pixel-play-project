# PixelPlay

실시간 채팅 플랫폼으로 시작해 향후 **라이브 스트리밍 서비스**로 확장할 계획인 웹 애플리케이션입니다.  
Next.js 16 App Router + Supabase Realtime 기반으로 구축됩니다.

---

## 기술 스택

| 분류                | 기술                                                              |
| ------------------- | ----------------------------------------------------------------- |
| Framework           | Next.js 16 (App Router) · React 19 · TypeScript (strict)          |
| Styling             | Tailwind CSS 4 · shadcn (base-nova) · Base UI · lucide-react      |
| Auth                | Supabase Auth (Email OTP · Google · GitHub OAuth)                 |
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

| 변수                                   | 설명                          |
| -------------------------------------- | ----------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase 프로젝트 URL         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | anon (공개) 키                |
| `AUTH_GOOGLE_CLIENT_ID`                | Google OAuth 클라이언트 ID    |
| `AUTH_GOOGLE_CLIENT_SECRET`            | Google OAuth 클라이언트 시크릿|
| `AUTH_GITHUB_CLIENT_ID`                | GitHub OAuth App Client ID    |
| `AUTH_GITHUB_CLIENT_SECRET`            | GitHub OAuth App Client Secret|

> 환경 변수 키를 추가·변경하면 `src/env.d.ts`의 타입 선언도 함께 수정해야 합니다.

---

### 3단계 — OAuth 공급자 콜백 URL 등록

Supabase Auth를 단독으로 사용합니다. OAuth callback URL은 Supabase 대시보드와 각 공급자 모두에 등록해야 합니다.

#### Supabase 대시보드
Authentication → URL Configuration → **Redirect URLs** 에 추가합니다.

```
http://localhost:3000/auth/callback
https://<your-domain>/auth/callback
```

#### Google

Google Cloud Console → 사용자 인증 정보 → OAuth 2.0 클라이언트 → **승인된 리디렉션 URI** 에 추가합니다.

```
https://<supabase-project-id>.supabase.co/auth/v1/callback
```

#### GitHub

GitHub → Developer settings → OAuth Apps → 앱 선택 → **Authorization callback URL** 에 입력합니다.

```
https://<supabase-project-id>.supabase.co/auth/v1/callback
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
│   └── auth.ts           # 로그인·회원가입·프로필 완성 서버 액션
├── app/                  # Next.js App Router
│   ├── auth/
│   │   ├── callback/     # OAuth code → session 교환 핸들러
│   │   ├── complete-profile/ # OAuth 유저 추가 정보 입력 페이지
│   │   ├── login/        # 로그인 페이지
│   │   └── signup/       # 회원가입 페이지
│   ├── chat/
│   │   ├── layout.tsx    # 채팅 영역만 헤더·푸터 높이를 제외한 뷰포트 높이 고정
│   │   └── [room-id]/    # 동적 채팅방 (URL의 UUID = Supabase `room.id`)
│   │       └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   ├── complete-profile/ # CompleteProfileForm
│   │   ├── login/        # LoginForm · OAuthButtons
│   │   ├── signup/       # SignupForm
│   │   └── login-button.tsx
│   ├── common/
│   │   ├── auth-listener.tsx # Supabase Auth 상태 → Zustand 동기화
│   │   ├── header.tsx
│   │   └── providers.tsx
│   ├── chat/             # 채팅방 · 메시지 목록 · 입력 · 참가자 패널 등
│   └── ui/               # shadcn / Base UI 컴포넌트
├── hook/
│   └── use-messages.ts   # 채팅 메시지 무한 스크롤 + Postgres Changes(INSERT) 구독
├── hooks/                # 커스텀 훅
│   └── use-profile.ts    # 로그인 세션 기준 `public.user` 프로필 조회 (TanStack Query)
├── lib/
│   ├── supabase/         # client.ts · server.ts · proxy.ts
│   ├── zod/              # 폼 유효성 스키마 + 기본값 상수
│   └── utils/
├── stores/
│   └── auth/             # Zustand Auth 스토어 (user · loading)
├── types/
│   ├── auth/
│   ├── database.types.ts # Supabase 자동 생성 타입 (npm run types)
│   └── user.ts
└── utils/
    └── auth/             # formatPhone 등 auth 관련 유틸
```

---

## 데이터베이스 스키마

### `user` 테이블

| 컬럼           | 타입          | 설명                                   |
| -------------- | ------------- | -------------------------------------- |
| `id`           | uuid (PK)     | 자동 생성                              |
| `oauth_id`     | text (UNIQUE) | Supabase Auth 유저 ID (`auth.users.id`)|
| `email`        | text          | 이메일                                 |
| `name`         | text          | 실명                                   |
| `display_name` | text          | 닉네임 (서비스 내 표시 이름)           |
| `birth`        | text          | 생년월일                               |
| `phone`        | text          | 휴대전화번호                           |
| `gender`       | enum          | `male` · `female` · `none`             |
| `created_at`   | timestamptz   | 생성 시각                              |
| `modified_at`  | timestamptz   | 최종 수정 시각                         |

### `room` · `message` · `room_member` 테이블 (채팅)

| 테이블         | 역할 |
| -------------- | ---- |
| `room`         | 채팅방 데이터. URL `[room-id]`와 `room.id`(UUID)가 대응 |
| `message`      | 채팅 메시지 `user_id`는 **`public.user.id`(PK)** 를 참조 |
| `room_member`  | 방별 참가자 `user_id`는 **`public.user.id`(PK)** 를 참조 |



### 타입 재생성

스키마 변경 후 아래 명령으로 `src/types/database.types.ts`를 갱신합니다.

```bash
npm run types
```

---

## 인증 구조

Supabase Auth 단독으로 인증을 처리합니다. 미들웨어(`proxy.ts`)가 모든 요청에서 세션을 검증하고 인증 가드 역할을 담당합니다.

```
[미들웨어 - proxy.ts]
  ├── 비로그인 + 비auth 페이지 → /auth/login 리다이렉트
  └── 로그인 + display_name 없음 + 비auth 페이지 → /auth/complete-profile 리다이렉트

[로그인]
  ├── LoginForm (이메일/비밀번호) → login() 서버 액션 → supabase.auth.signInWithPassword
  └── OAuthButtons → supabase.auth.signInWithOAuth → /auth/callback → exchangeCodeForSession

[회원가입 - 이메일 OTP]
  ├── [1] sendOtpAction(email)          → 중복 확인(RPC) → OTP 발송
  ├── [2] verifyOtpAction(email, token) → OTP 검증 → 임시 세션 생성
  └── [3] completeSignupAction(data)    → 비밀번호·프로필 저장 → auth.users.user_metadata 동기화

[OAuth 회원가입]
  ├── OAuthButtons → /auth/callback → 세션 생성
  └── display_name 없음 → /auth/complete-profile → completeOAuthProfileAction
```

**클라이언트 Auth 상태 관리**

```
AuthListener (providers.tsx에 마운트, 앱 전체에서 1회)
  ├── 초기: getUser() → Zustand store 세팅
  └── 이후: onAuthStateChange 구독 → 로그인/로그아웃/토큰갱신 시 store 자동 반영

컴포넌트 → useAuthStore() → 네트워크 없이 즉시 유저 정보 접근
```

---

## 실시간 통신 방침

채팅 실시간 기능은 `@supabase/supabase-js`의 Realtime을 활용합니다.

- **Postgres Changes** — DB 변경 이벤트 구독
- **Broadcast** — 클라이언트 간 즉시 메시지 전송
- **Presence** — 온라인 상태 · 타이핑 인디케이터

Socket.IO 등 별도 WebSocket 서버는 도입하지 않습니다.

---

## 채팅 화면 (`/chat/[room-id]`)

- **동적 라우트** — URL 경로의 `room-id`가 Supabase `room.id`와 일치하는 방의 메시지·멤버·방 정보를 조회
- **발신자 식별** — Supabase Auth 세션은 `useUserStore`, 앱 프로필 행은 `useProfile()`으로 조회 메시지 INSERT 시 `message.user_id`에는 **`public.user.id`(PK)** 를 사용합니다 `oauth_id` 사용안함
- **표시 이름** — 메시지·멤버 조회 시 `public.user`의 **`nickname`** 을 조인해 표시
- **실시간** — `use-messages.ts`에서 `room_id` 기준으로 **Postgres Changes** `INSERT` 를 구독해 새 메시지를 반영
- **레이아웃** — `src/app/chat/layout.tsx`에서 채팅 영역만 높이로 잡아, 페이지 전체 스크롤과 채팅 영역 이중 스크롤 방지

### RLS 정책 요약

| schema | table | policy | action | roles | using (`qual`) | with check |
| ------ | ----- | ------ | ------ | ----- | -------------- | ---------- |
| `public` | `room_member` | `members_insert` | `INSERT` | `{public}` | `NULL` | `(auth.uid() = user_id)` |
| `public` | `room_member` | `members_select` | `SELECT` | `{public}` | `true` | `NULL` |
| `public` | `message` | `messages_delete` | `DELETE` | `{public}` | `(auth.uid() = user_id)` | `NULL` |
| `public` | `message` | `messages_insert_as_self` | `INSERT` | `{authenticated}` | `NULL` | `EXISTS (SELECT 1 FROM "user" u WHERE ((u.id = message.user_id) AND (u.oauth_id = (auth.uid())::text)))` |
| `public` | `message` | `messages_select` | `SELECT` | `{public}` | `true` | `NULL` |
| `public` | `room` | `rooms_insert` | `INSERT` | `{public}` | `NULL` | `(auth.uid() = user_id)` |
| `public` | `room` | `rooms_select` | `SELECT` | `{public}` | `true` | `NULL` |

#### 정책 설명 (간단 요약)

- 조회(`SELECT`)는 `true` 정책으로 열어두고, 생성/삭제(`INSERT`/`DELETE`)는 본인 데이터만 허용합니다.
- `message`의 `INSERT`는 `EXISTS`로 검증합니다. (`message.user_id = public.user.id` 이고, 그 `public.user.oauth_id`가 현재 `auth.uid()`와 같은 경우만 허용)

#### 중요 포인트

- `auth.uid()`와 `public.user.id`는 다른 값일 수 있어 직접 비교 정책만 쓰면 거부될 수 있습니다.
- 따라서 메시지 작성 정책은 `public.user`를 통해 Auth 사용자와 프로필 PK를 매핑하는 방식이 안전합니다.

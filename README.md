# PixelPlay

실시간 채팅 플랫폼으로 시작해 향후 **라이브 스트리밍 서비스**로 확장할 계획인 웹 애플리케이션입니다.  
Next.js 16 App Router + Supabase Realtime 기반으로 구축됩니다.

---

## 프로젝트 개요

- PixelPlay는 실시간 채팅 플랫폼으로 시작해 향후 라이브 스트리밍 서비스로 확장할 Next.js 웹 애플리케이션입니다.
- 주요 스택은 Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, shadcn `base-nova`, Base UI, Supabase Auth/Postgres/Realtime, TanStack Query v5, Zustand v5입니다.
- 인증은 Supabase Auth 단독으로 처리하며, `src/lib/supabase/proxy.ts`가 세션 검증과 라우트 가드를 담당합니다.
- 데이터 타입은 Supabase 스키마에서 생성된 `src/types/database.types.ts`를 기준으로 사용합니다.
- 채팅 실시간 기능은 Supabase Realtime의 Postgres Changes, Broadcast, Presence를 사용하는 방향입니다. 별도 Socket.IO 서버는 도입하지 않습니다.

---

## 기술 스택

| 분류                | 기술                                                         |
| ------------------- | ------------------------------------------------------------ |
| Framework           | Next.js 16 (App Router) · React 19 · TypeScript (strict)     |
| Styling             | Tailwind CSS 4 · shadcn (base-nova) · Base UI · lucide-react |
| Auth                | Supabase Auth (Email OTP · Google · GitHub OAuth)            |
| Database / Realtime | Supabase (Postgres + Realtime)                               |
| Server State        | TanStack Query v5                                            |
| Client State        | Zustand v5                                                   |
| Form / Validation   | react-hook-form v7 · Zod v4                                  |
| Theme               | next-themes (다크모드)                                       |
| Formatter           | Prettier + Tailwind 플러그인                                 |

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

| 변수                                   | 설명                             |
| -------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase 프로젝트 URL            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | anon (공개) 키                   |
| `AUTH_SECRET`                          | 세션 암호화 시크릿 (임의 문자열) |
| `AUTH_GOOGLE_CLIENT_ID`                | Google OAuth 클라이언트 ID       |
| `AUTH_GOOGLE_CLIENT_SECRET`            | Google OAuth 클라이언트 시크릿   |
| `AUTH_GITHUB_CLIENT_ID`                | GitHub OAuth App Client ID       |
| `AUTH_GITHUB_CLIENT_SECRET`            | GitHub OAuth App Client Secret   |

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

## 검증 명령

- 개발 서버: `npm run dev`
- 프로덕션 빌드/타입 확인: `npm run build`
- Supabase 타입 재생성: `npm run types`

---

## 디렉토리 구조

```
src/
├── actions/              # Server Actions
│   ├── auth.ts           # 로그인·회원가입·프로필 업데이트·OAuth 연동해제 서버 액션
│   └── chat-room.ts      # 채팅방 생성 서버 액션
├── app/                  # Next.js App Router
│   ├── (settings)/       # 설정 라우트 그룹
│   │   ├── layout.tsx    # 설정 레이아웃 (사이드바 포함)
│   │   └── profile/      # 프로필 설정 페이지
│   ├── api/auth/withdraw/route.ts # 회원가입 취소 계정 삭제 API
│   ├── auth/
│   │   ├── callback/     # OAuth code → session 교환 핸들러
│   │   ├── complete-profile/ # OAuth 유저 추가 정보 입력 페이지
│   │   ├── login/        # 로그인 페이지
│   │   └── signup/       # 회원가입 페이지
│   ├── chat/[room-id]/   # 채팅방 상세 페이지
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   ├── complete-profile/ # CompleteProfileForm
│   │   ├── login/        # LoginForm · OAuthButtons
│   │   ├── password/     # VerifyPasswordForm · PasswordChangeForm · PasswordChangeDialog
│   │   ├── signup/       # SignupForm
│   │   ├── auth-listener.tsx     # Supabase Auth 상태 → Zustand 동기화
│   │   ├── auth-toast-handler.tsx # OAuth 콜백 후 토스트 표시 (login · welcome · linked 파라미터 처리)
│   │   └── login-button.tsx
│   ├── chat/
│   │   ├── chat-room.tsx              # 채팅방 컨테이너·패널 구성
│   │   ├── chat-room-card.tsx         # 채팅방 목록 카드
│   │   ├── chat-room-empty-state.tsx  # 채팅방 목록 빈 상태
│   │   ├── chat-room-list.tsx         # 채팅방 목록
│   │   ├── chat-room-list-header.tsx  # 채팅방 목록 헤더
│   │   ├── chat-room-list-skeleton.tsx # 채팅방 목록 로딩 UI
│   │   ├── chat-room-tabs.tsx         # 채팅·라이브 탭
│   │   ├── create-chat-room-dialog.tsx # 채팅방 생성 다이얼로그
│   │   └── chat-emoji-picker.tsx      # 이모지 피커
│   ├── common/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── logo.tsx
│   │   ├── main-menu-sidebar.tsx
│   │   ├── main-menu-sidebar-item.tsx
│   │   └── providers.tsx
│   ├── live/
│   │   └── live-list.tsx
│   ├── member/
│   │   ├── member-list.tsx         # 참여자 목록
│   │   └── member-item.tsx         # 참여자 한 행
│   ├── message/
│   │   ├── message-list.tsx        # 메시지 목록·스크롤
│   │   ├── message-item.tsx        # 단일 메시지 행
│   │   └── message-input.tsx       # 메시지 입력·전송
│   ├── setting/
│   │   ├── profile/
│   │   │   ├── header-profile-badge.tsx # 헤더 유저 아바타 + 드롭다운
│   │   │   ├── profile-form.tsx          # 프로필 수정 폼 (닉네임·사진)
│   │   │   ├── profile-avatar-upload.tsx # 아바타 업로드 위젯 (드래그&드롭 지원)
│   │   │   ├── profile-providers-card.tsx # OAuth 연동·해제 카드
│   │   │   ├── profile-card.tsx          # 설정 섹션 Card 래퍼
│   │   │   └── profile-form-skeleton.tsx # 프로필 폼 로딩 스켈레톤
│   │   ├── setting-sidebar.tsx           # 설정 페이지 사이드바
│   │   └── setting-menu-item.tsx         # 메뉴 아이템 렌더러
│   └── ui/               # shadcn / Base UI 컴포넌트
├── constants/
│   ├── app-message.ts    # 사용자 노출 메시지(APP_MESSAGE)
│   ├── app-message-code.ts # 메시지 코드(APP_MESSAGE_CODE)와 AppMessageCode 타입
│   ├── auth.ts
│   ├── chat-emoji-picker.ts # 이모지 피커 분류·목록
│   ├── chat-room.ts
│   ├── footer.ts
│   ├── main-menu-sidebar.ts
│   ├── message.ts
│   ├── query-keys.ts     # 중앙 집중식 Query Key Factory (QUERY_KEYS)
│   └── setting-menu.ts   # 설정 메뉴 아이템 목록
├── hooks/
│   ├── use-chat-room.ts  # 채팅방 단일 조회·Realtime 구독
│   ├── use-chat-room-counts.ts
│   ├── use-chat-rooms.ts # 채팅방 목록 조회
│   ├── use-messages.ts   # 메시지 목록·Realtime 구독
│   ├── use-mobile.ts     # 모바일 뷰포트 감지 훅
│   ├── use-profile.ts    # useUser() — public.user 프로필 React Query 훅
│   └── use-room-members.ts # 채팅방 멤버 목록
├── lib/
│   ├── supabase/         # admin-client.ts · client.ts · server.ts · proxy.ts
│   ├── zod/              # auth.ts · chat-room.ts
│   └── utils/
├── mock/
│   └── chat-room.ts
├── stores/
│   ├── auth.ts           # Zustand Auth 스토어
│   └── chat-room.ts      # 채팅방 선택 상태
├── types/
│   ├── action.ts         # Server Action 공통 결과 타입
│   ├── app-message.ts    # 사용자 노출 메시지 타입
│   ├── auth.ts
│   ├── chat-room.ts
│   ├── chat-room-member.ts
│   ├── database.types.ts # Supabase 자동 생성 타입 (npm run types)
│   ├── main-menu-sidebar.ts
│   ├── message.ts        # message 테이블 타입
│   ├── setting-menu.ts
│   ├── supabase.types.ts # Supabase 보조·확장 타입
│   └── user.ts
└── utils/
    ├── app-message.ts    # 메시지 코드 → 사용자 메시지 변환
    ├── chat-room.ts
    ├── format.ts         # formatDate · formatPhone 유틸
    └── toast-message.ts  # APP_MESSAGE 기반 toast 헬퍼
```

---

## 앱 메시지 관리

사용자에게 노출되는 toast, alert, error UI 문구는 `src/constants/app-message.ts`의 `APP_MESSAGE`에서 관리합니다. 호출부에서는 문자열을 직접 작성하지 않고 `src/constants/app-message-code.ts`의 `APP_MESSAGE_CODE`를 사용합니다.

- `APP_MESSAGE_CODE`는 자동완성과 타입 검사를 위해 별도 파일에서 관리합니다.
- `AppMessageCode` 타입은 `APP_MESSAGE_CODE`에서 파생합니다.
- `APP_MESSAGE`와 `APP_MESSAGE_CODE`의 도메인과 key는 반드시 일치해야 합니다.
- 원본 Supabase/Auth/DB 에러 메시지는 사용자에게 직접 노출하지 않고 `console.error`로만 남깁니다.
- Zod, React Hook Form의 `FieldError`로 필드 아래에 표시하는 검증 메시지는 toast로 중복 노출하지 않습니다.
- title은 짧은 명사형 또는 상태형으로 작성하고, 자세한 안내는 description에 작성합니다.

세부 문구 규칙은 `.agents/app-message-convention/SKILLS.md`를 따릅니다.

---

## 데이터베이스 스키마

### `user` 테이블

| 컬럼               | 타입                        | 설명                                    |
| ------------------ | --------------------------- | --------------------------------------- |
| `id`               | uuid (PK)                   | 자동 생성                               |
| `oauth_id`         | text (UNIQUE)               | Supabase Auth 유저 ID (`auth.users.id`) |
| `email`            | text                        | 이메일                                  |
| `name`             | text                        | 실명                                    |
| `nickname`         | text                        | 닉네임 (서비스 내 표시 이름)            |
| `birth`            | text                        | 생년월일                                |
| `phone`            | text                        | 휴대전화번호                            |
| `gender`           | enum                        | `male` · `female` · `none`              |
| `photo_url`        | text (nullable)             | 프로필 사진 URL (이메일 유저는 null)    |
| `linked_providers` | oauth_provider[] (nullable) | 연동된 OAuth 공급자 목록                |
| `created_at`       | timestamptz                 | 생성 시각                               |
| `modified_at`      | timestamptz                 | 최종 수정 시각                          |

### `chatroom` 테이블

| 컬럼           | 타입            | 설명             |
| -------------- | --------------- | ---------------- |
| `id`           | uuid (PK)       | 자동 생성        |
| `title`        | text            | 채팅방 제목      |
| `description`  | text (nullable) | 채팅방 설명      |
| `max_capacity` | int             | 최대 입장 인원   |
| `owner_id`     | uuid (FK)       | 생성자 (user.id) |
| `created_at`   | timestamptz     | 생성 시각        |
| `modified_at`  | timestamptz     | 최종 수정 시각   |

### `chatroommember` 테이블

| 컬럼             | 타입                   | 설명                                    |
| ---------------- | ---------------------- | --------------------------------------- |
| `id`             | uuid (PK)              | 자동 생성                               |
| `chat_room_id`   | uuid (FK)              | chatroom.id                             |
| `user_id`        | uuid (FK)              | user.id                                 |
| `status`         | enum                   | `JOINED` · `EXITED` · `BANNED`          |
| `last_joined_at` | timestamptz (nullable) | 마지막 입장 시각                        |
| `last_read_at`   | timestamptz (nullable) | 마지막 읽음 시각 (안읽은 메시지 계산용) |
| `created_at`     | timestamptz            | 최초 참여 시각                          |

### `message` 테이블

| 컬럼           | 타입        | 설명        |
| -------------- | ----------- | ----------- |
| `id`           | uuid (PK)   | 자동 생성   |
| `chat_room_id` | uuid (FK)   | chatroom.id |
| `user_id`      | uuid (FK)   | user.id     |
| `content`      | text        | 메시지 내용 |
| `created_at`   | timestamptz | 전송 시각   |
| `modified_at`  | timestamptz | 수정 시각   |

### DB 함수

| 함수                                          | 설명                                                    |
| --------------------------------------------- | ------------------------------------------------------- |
| `check_email_exists(target_email text)`       | 이메일 중복 확인 (OTP 발송 전 호출, `SECURITY DEFINER`) |
| `check_nickname_exists(target_nickname text)` | 닉네임 중복 확인 (`SECURITY DEFINER`)                   |

### Supabase Storage

| 버킷       | 경로                             | 용도                      |
| ---------- | -------------------------------- | ------------------------- |
| `profiles` | `avatars/{user.id}/avatar.{ext}` | 유저 프로필 사진 (upsert) |

- 업로드 시 `upsert: true` 옵션으로 기존 파일 덮어씀
- 공개 URL 캐시 무효화: `?t={Date.now()}` 쿼리 파라미터 추가
- 사진 삭제 시 Storage 파일도 함께 제거

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
  └── 로그인 + nickname 없음 + 비auth 페이지 → /auth/complete-profile 리다이렉트

[로그인]
  ├── LoginForm (이메일/비밀번호) → login() 서버 액션 → supabase.auth.signInWithPassword
  └── OAuthButtons → supabase.auth.signInWithOAuth → /auth/callback → exchangeCodeForSession

[회원가입 - 이메일 OTP]
  ├── [1] sendOtpAction(email)          → 중복 확인(RPC) → OTP 발송
  ├── [2] verifyOtpAction(email, token) → OTP 검증 → 임시 세션 생성
  └── [3] completeSignupAction(data)    → 비밀번호·프로필 저장 → auth.users.user_metadata 동기화

[OAuth 회원가입]
  ├── OAuthButtons → /auth/callback → 세션 생성
  ├── 신규 유저 (nickname 없음) → /auth/complete-profile → completeOAuthProfileAction
  │     └── user.user_metadata.avatar_url → photo_url DB 저장
  └── 기존 유저 + 신규 provider 연동 → linked_providers·photo_url(없을 경우) DB 업데이트
```

**클라이언트 Auth 상태 관리**

```
AuthListener (providers.tsx에 마운트, 앱 전체에서 1회)
  ├── 초기: getUser() → Zustand store 세팅
  └── 이후: onAuthStateChange 구독 → 로그인/로그아웃/토큰갱신 시 store 자동 반영

컴포넌트 → useAuthStore()   → AuthUser (Supabase auth.users) 즉시 접근
컴포넌트 → useUser()        → DBUser (public.user) React Query 캐시 (5분 staleTime)
```

---

## 설정 페이지 기능

### 프로필 (`/profile`)

| 기능            | 설명                                                                 |
| --------------- | -------------------------------------------------------------------- |
| 닉네임 변경     | 중복 확인(`checkNicknameAction`) 후 저장 가능                        |
| 프로필 사진     | 파일 선택·드래그&드롭 업로드, Supabase Storage 저장, 제거 지원       |
| OAuth 연동      | `supabase.auth.signInWithOAuth` → callback → `linked_providers` 갱신 |
| OAuth 연동 해제 | `unLinkOAuthAction` — identity 삭제 + `linked_providers` DB 업데이트 |

**제약 조건:** OAuth 전용 가입 유저는 최소 1개의 OAuth 계정 연동 필수. 이메일 가입 유저는 자유롭게 해제 가능.

### 비밀번호 변경

현재 비밀번호 검증(`verifyCurrentPasswordAction`) → 새 비밀번호 설정(`changePasswordAction`). 이메일 가입 유저에게만 메뉴 노출 (`isCanChangePassword` Zustand 플래그).

---

## 실시간 통신 방침

채팅 실시간 기능은 `@supabase/supabase-js`의 Realtime을 활용합니다.

- **Postgres Changes** — DB 변경 이벤트 구독
- **Broadcast** — 클라이언트 간 즉시 메시지 전송
- **Presence** — 온라인 상태 · 타이핑 인디케이터

Socket.IO 등 별도 WebSocket 서버는 도입하지 않습니다.

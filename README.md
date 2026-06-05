# PixelPlay

실시간 채팅과 라이브 스트리밍을 함께 제공하는 웹 애플리케이션입니다.

Next.js 16 App Router, React 19, Supabase Auth/Postgres/Realtime, TanStack Query, Zustand를 중심으로 공개 랜딩, 라이브 목록·시청·검색, OBS 오버레이, 채팅방 목록·상세·검색, 메시지, 참여자 관리, 크리에이터 채널 관리(채팅·보안·후원·라이브·통계), 팔로잉, 포인트 충전과 후원, 프로필 설정 기능을 제공합니다.

쓰기 작업은 Server Action에서 인증 사용자를 확인한 뒤 Supabase `service_role` 경계로 RPC를 호출하는 방식으로 통일되어 있습니다. 읽기는 RPC의 실행 권한에 따라, `authenticated`에 열린 RPC는 브라우저 client + TanStack Query로, `service_role` 전용 RPC(크리에이터 스튜디오·OBS 오버레이 등)는 Server Component(SSR)에서 조회합니다. 클라이언트 컴포넌트는 TanStack Query mutation hook으로 pending 상태와 후처리를 관리합니다.

---

## 기술 스택

| 분류              | 기술                                                    |
| ----------------- | ------------------------------------------------------- |
| Framework         | Next.js 16 App Router, React 19, TypeScript strict      |
| Styling           | Tailwind CSS 4, shadcn, Base UI, lucide-react           |
| Auth              | Supabase Auth, Email OTP, Google OAuth, GitHub OAuth    |
| Database          | Supabase Postgres                                       |
| Realtime          | Supabase Realtime Postgres Changes, Presence, Broadcast |
| Payments          | Toss Payments (포인트 충전)                             |
| Server State      | TanStack Query v5                                       |
| Client State      | Zustand v5                                              |
| Form / Validation | react-hook-form v7, Zod v4                              |
| Animation         | Motion                                                  |
| Theme             | next-themes                                             |
| Formatter         | Prettier, prettier-plugin-tailwindcss                   |

---

## 시작하기

### 요구 사항

- Node.js 20 이상
- npm 10 이상
- Supabase 프로젝트
- Google OAuth 앱
- GitHub OAuth 앱

### 설치

```bash
git clone https://github.com/PixelPlay-RGB/pixel-play-project.git
cd pixel-play-project
npm install
```

### 환경 변수

루트의 `.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

| 변수                                      | 설명                                                      |
| ----------------------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                | Supabase 프로젝트 URL                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`    | Supabase publishable key                                  |
| `NEXT_PUBLIC_SITE_URL`                    | OBS 오버레이 주소 생성에 사용할 공개 서비스 URL           |
| `NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS` | 개발 중 React Query Devtools 표시 여부 (`true`일 때 표시) |
| `SUPABASE_SERVICE_ROLE_KEY`               | 회원 탈퇴 등 관리자 작업에 사용하는 service role key      |
| `LIVE_OVERLAY_TOKEN_SECRET`               | 스트림 키와 OBS 오버레이 key 생성에 사용하는 서버 secret  |

환경 변수 키를 추가하거나 변경하면 루트의 `env.d.ts` 타입 선언도 함께 갱신합니다.

### OAuth 콜백 URL

Supabase Auth를 단독으로 사용하므로 Supabase 대시보드와 각 OAuth 공급자에 콜백 URL을 등록합니다.

Supabase Authentication Redirect URLs.

```text
http://localhost:3000/auth/callback
https://<your-domain>/auth/callback
```

Google, GitHub OAuth callback URL.

```text
https://<supabase-project-id>.supabase.co/auth/v1/callback
```

### 개발 서버

```bash
npm run dev
```

브라우저에서 <http://localhost:3000>에 접속합니다. 비로그인 상태의 `/`, `/live`, `/live/*`, `/chat/room/[roomId]`는 공개 화면을 표시하고, 보호 라우트는 `/auth/login?next=<현재경로>`로 이동합니다.

---

## 명령어

| 명령어                 | 설명                                                   |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | 개발 서버 실행                                         |
| `npm run build`        | 프로덕션 빌드와 타입 확인                              |
| `npm run start`        | 프로덕션 서버 실행                                     |
| `npm run lint`         | ESLint 검사                                            |
| `npm run format`       | Prettier 포맷 적용                                     |
| `npm run format:check` | Prettier 포맷 검사                                     |
| `npm run typecheck`    | TypeScript 타입 검사                                   |
| `npm run db:types`     | Supabase 타입을 `src/types/database.types.ts`로 재생성 |

---

## 라우터 구조

| 라우트                                                       | 접근       | 설명                                                       |
| ------------------------------------------------------------ | ---------- | ---------------------------------------------------------- |
| `/`                                                          | 공개       | 랜딩 페이지. 라이브 둘러보기, 채팅 시작하기, 로그인 CTA    |
| `/live`                                                      | 공개       | 라이브 목록. 필터·정렬·사이드바(팔로잉·트렌딩·인기 키워드) |
| `/live/search?query=`                                        | 공개       | 라이브 검색 결과                                           |
| `/live/[creatorId]`                                          | 공개       | 라이브 시청 화면                                           |
| `/live/[creatorId]/chat[/overlayKey]`                        | 공개(읽기) | OBS 채팅 오버레이                                          |
| `/live/[creatorId]/alerts/donation[/overlayKey]`             | 공개(읽기) | OBS 후원 알림 오버레이                                     |
| `/chat`                                                      | 보호       | 채팅방 목록                                                |
| `/chat/room/[roomId]`                                        | 혼합       | 채팅방 상세(비로그인은 공유 preview, 로그인은 상세)        |
| `/chat/search?query=`                                        | 보호       | 채팅방 검색 결과                                           |
| `/channel/live` `/chat` `/security` `/donation` `/analytics` | 보호       | 크리에이터 채널 관리(스튜디오)                             |
| `/user` → `/user/profile`                                    | 보호       | 프로필 설정                                                |
| `/user/following`                                            | 보호       | 팔로잉한 채널 목록                                         |
| `/user/donations`                                            | 보호       | 후원 내역과 포인트 충전                                    |

- 보호 라우트는 비로그인 접근 시 `/auth/login?next=<현재경로>`로 이동하고, 로그인 성공 후 원래 경로로 돌아갑니다.
- `/live`, `/channel/*`, `/user/*`는 사이드바 셸 레이아웃을 사용하며 공용 Footer 대신 사이드바 하단 크레딧을 표시합니다.
- OBS 오버레이 라우트(`/live/[creatorId]/chat`, `/alerts/donation`)는 Footer와 헤더를 숨긴 투명 배경 화면으로 렌더링합니다.
- 헤더 내비게이션은 라이브, 채팅 탭 순서로 제공하고, 검색 입력은 라이브 라우터에서는 라이브 검색으로, 채팅 관련 라우터에서는 채팅방 검색으로 이동합니다.

---

## 주요 기능

### 인증

- 이메일 OTP 인증 후 비밀번호와 프로필을 완성하는 회원가입 흐름을 제공합니다.
- OTP 인증 직후 생성되는 email 세션은 `/auth/signup`에 머무르며, 회원가입 폼에서 나머지 정보를 모두 입력해야 가입을 완료할 수 있습니다.
- 이메일과 비밀번호 기반 로그인을 제공합니다.
- 회원가입과 새 비밀번호 변경은 Supabase Auth 정책과 맞춰 최소 8자, 영문 소문자, 영문 대문자, 숫자, 특수문자를 요구합니다.
- 닉네임은 2자 이상 10자 이하의 영문, 숫자, 한글만 허용하며 공백과 특수문자는 사용할 수 없습니다.
- 생년월일은 KST 기준 오늘 이후 날짜를 선택할 수 없으며, date input `max`와 Zod schema에서 함께 검증합니다.
- 성별은 `male`, `female`, `none` 중 하나를 사용자가 직접 선택해야 하며 기본 선택값을 두지 않습니다.
- 로그인과 현재 비밀번호 확인은 기존 계정 호환을 위해 비밀번호 입력 여부만 검증하고, 실제 인증은 Supabase Auth에 위임합니다.
- Google, GitHub OAuth 로그인과 추가 프로필 입력 흐름을 제공하고, 연동 계정 목록을 `linked_providers`로 관리합니다.
- 로그인 상태는 Supabase 세션을 기준으로 검증하고 `AuthListener`가 Zustand store에 동기화합니다.
- 로그인 완료 사용자가 `/auth/login`, `/auth/signup`에 직접 접근하면 `next` 경로로 이동하고, 유효한 `next`가 없으면 `/live`로 이동합니다.
- 프로필이 없는 OAuth 로그인 유저는 `/auth/complete-profile`로 이동합니다.
- 비밀번호 변경, 프로필 수정, 프로필 이미지 업로드와 삭제, 회원 탈퇴 API를 제공합니다.
- 프로필 이미지가 없는 유저는 `public/default-avatar.webp` 기본 이미지를 표시합니다.
- 로그인, OAuth 로그인, 회원가입 OTP, 닉네임 확인, 프로필 완성, 프로필 수정, 로그아웃은 mutation hook으로 호출 상태와 toast, router 이동, query invalidation을 관리합니다.

### 라이브 (시청자)

- `/live`는 비로그인도 접근할 수 있는 라이브 목록이며, `get_live_list` RPC로 필터·정렬·페이지네이션·팔로잉 여부를 한 응답으로 조회합니다.
- 필터는 전체, 팔로잉, 방금 시작, 채팅 활발(`ALL`, `FOLLOWING`, `RECENT`, `ACTIVE_CHAT`), 정렬은 시청자순, 시작순, 채팅 활발순(`VIEWER_COUNT_DESC`, `STARTED_AT_DESC`, `RECENT_CHAT_DESC`)을 제공합니다.
- 목록 개인화(`isFollowing`, `FOLLOWING` 필터)는 보안을 위해 호출자가 넘긴 값이 아니라 `auth.uid()`를 기준으로 계산합니다.
- 사이드바는 팔로잉 채널(`get_following_channel_list`), 지금 뜨는 채널(트렌딩), 인기 키워드(`get_live_popular_keywords`)를 보여줍니다.
- `/live/search`는 `search_live_results` RPC로 라이브 검색 결과를, `/live/[creatorId]`는 `get_live_watch`·`get_live_watch_count`로 시청 화면을 구성합니다.

### OBS 오버레이

- 크리에이터는 OBS 브라우저 소스에 붙일 채팅 오버레이(`/live/[creatorId]/chat/[overlayKey]`)와 후원 알림 오버레이(`/live/[creatorId]/alerts/donation/[overlayKey]`)를 사용합니다.
- 오버레이 key는 서버에서 `LIVE_OVERLAY_TOKEN_SECRET` 기반 HMAC으로 생성하며, 키 버전을 올려 재발급할 수 있습니다.
- 오버레이 초기 데이터는 `service_role` 전용 RPC(`get_live_chat_overlay_snapshot`, `get_live_donation_alert_overlay_snapshot`)를 Server Component에서 조회하고, 이후 채팅·후원은 Supabase Realtime으로 반영합니다.
- 채팅 오버레이는 컨테이너 높이에 맞춰 메시지를 보정하고 최대 표시 개수를 제한하며, 후원 알림은 `--live` 코랄 톤으로 강조합니다.

### 크리에이터 채널 관리 (스튜디오)

- `/channel/live`, `/channel/chat`, `/channel/security`, `/channel/donation`, `/channel/analytics`를 사이드바 셸로 제공합니다.
- 스튜디오 데이터는 `service_role` 전용 `get_creator_studio_snapshot` RPC를 Server Component에서 조회하고, 설정 저장은 `upsert_creator_studio_setting`으로 처리합니다.
- 채팅 설정(`/channel/chat`)에서는 참여 범위, 팔로워 대기 시간, 슬로우 모드, 링크 차단, 금칙어, 채팅 규칙을 관리합니다.
- 보안 설정(`/channel/security`)에서는 스트림 키와 OBS 오버레이 URL을 발급·재발급합니다. 재발급은 `rotate_live_security_token_version`으로 키 버전을 올려 처리합니다.
- 후원 설정·대시보드(`/channel/donation`)는 `get_creator_donation_dashboard`로 후원 통계를 조회합니다.
- 설정 화면은 공통 컴포넌트(`SettingsPage`, `SettingsCard`, `SideTipCard`, `HintNote`)와 스크롤 시 나타나는 공통 저장 바(`StickySaveBar`)로 구조를 통일했습니다.

### 팔로잉

- 라이브 시청·목록에서 크리에이터를 팔로우/언팔로우할 수 있고, 관계는 `viewer_creator_relation` 테이블에 저장합니다.
- `followCreatorAction`, `unfollowCreatorAction`이 `follow_creator`, `unfollow_creator` RPC를 호출하고, 팔로잉 목록은 `get_following_channel_list`로 조회합니다.

### 포인트 충전과 후원

- 사용자는 포인트 지갑(`wallet_account`)을 통해 포인트를 충전하고 라이브에서 후원합니다.
- 충전은 Toss Payments 연동(`/api/payments/toss/prepare`, `/confirm`, `/webhook`)으로 처리하고, 승인은 `confirm_wallet_charge` RPC가 멱등 처리합니다.
- 후원 전송은 `send_live_donation` RPC가 지갑 차감과 후원 기록, 라이브 후원 메시지 생성을 단일 트랜잭션으로 처리합니다.
- `/user/donations`에서 후원 내역과 충전 진입을 함께 보여주며, `get_user_donation_snapshot`으로 데이터를 조회합니다.

### 라우터와 공개 화면

- `/`는 공개 랜딩 페이지이며 `get_landing_snapshot`으로 하이라이트 데이터를 조회합니다.
- `/`와 `/chat/room/[roomId]`, `/live`, `/live/*`는 비로그인 상태에서도 공개 화면을 렌더링합니다.

### SEO와 공유 미리보기

- production domain은 `https://pixel-play.studio`를 metadata base URL로 사용합니다.
- 메인 페이지와 채팅방 상세 페이지는 Open Graph와 Twitter large image metadata를 제공합니다.
- 공유 썸네일은 `public/og-home.webp`, `public/og-chat-room.webp` 정적 에셋을 사용합니다.
- 비로그인 채팅방 preview는 `get_public_chat_room_metadata` RPC로 title과 description만 조회합니다. 메시지, 멤버, unread, presence는 공개하지 않습니다.

### 채팅방 목록

- `JOINED`, `NOT_JOINED`, `OWNED` 탭으로 채팅방 목록을 분리하고, `get_chat_room_list` RPC로 탭별 개수, 정렬, 번호형 페이지네이션, 탭 내 검색, unread_count, total_count를 한 응답으로 처리합니다.
- `JOINED`, `OWNED` 탭의 기본 정렬은 최신 메시지순이며 정렬 옵션은 최신 메시지순, 생성일 최신순, 참여자 많은순으로 제공합니다. `NOT_JOINED` 탭의 기본 정렬은 생성일 최신순이며 정원 마감 방을 제외합니다.
- 탭 변경 시 정렬값은 탭별 기본값으로, 검색어는 빈 값으로 초기화하며, 검색 중에는 탭 badge가 `total_count`로 오버라이드됩니다.
- 채팅방 목록은 `useQuery`와 `keepPreviousData` 기반 번호형 페이지네이션으로 조회하고, page size는 grid 열 수에 맞춰 모바일 8개, 2열 12개, 3열 12개, 4열 16개로 조정합니다.
- 채팅방 생성 Dialog에서 제목, 설명, 정원을 입력해 방을 만들 수 있으며 `createChatRoomAction`이 `create_chat_room` RPC를 호출합니다.

### 채팅방 상세

- 비로그인 사용자가 공유 링크로 접근하면 title, description, 로그인 CTA만 있는 public preview를 표시하고, 로그인 후 같은 URL에서 상세 화면으로 전환됩니다.
- 방 정보, 현재 유저 멤버십, 활성 참여자 목록은 `get_chat_room_detail` RPC로 함께 조회합니다.
- 미참여 유저가 진입하면 `JoinChatRoomDialog`가 표시되고, 정원 마감 상태에서는 참여 불가 안내만 표시합니다. 참여 완료 후 Realtime으로 자동 상태 전환됩니다.
- 방장은 참여자 Popover에서 강퇴와 방장 권한 위임을 실행할 수 있으며, 현재 정책상 방장은 채팅방 나가기가 제한됩니다.
- 강퇴된 유저는 Realtime 이벤트로 감지되어 입력이 잠기고 안내 Dialog가 표시됩니다.
- 참여, 나가기, 읽음 처리, 강퇴, 방장 위임은 Server Action과 RPC를 통해 처리합니다.

### 메시지

- 메시지 목록은 `useInfiniteQuery`로 최신 메시지부터 조회하고 상단 근접 시 이전 메시지를 추가로 가져옵니다.
- 같은 작성자의 연속 text 메시지는 bubble grouping으로 avatar와 nickname 반복을 줄입니다.
- 새 메시지는 Supabase Realtime `postgres_changes` INSERT 이벤트를 받아 React Query cache에 `created_at desc` 순서로 병합합니다.
- 텍스트 메시지는 `sendMessageAction`이 `send_chat_message` RPC를 호출하는 방식으로 전송하고, optimistic 메시지를 먼저 삽입한 뒤 RPC가 반환한 message id로 교체합니다. 실패 시 재전송과 취소 액션을 표시합니다.
- 메시지 입력 중인 멤버는 Motion 기반 3점 typing indicator로 표시하고, 일정 시간 입력이 없으면 접속 dot으로 돌아갑니다.
- 날짜 구분 system 메시지는 PostgreSQL AFTER INSERT Trigger(`trigger_insert_date_divider_message`)가 매일 첫 메시지 INSERT 시 `📅 YYYY년 MM월 DD일 요일` 형식으로 자동 삽입하며, partial unique index와 `ON CONFLICT DO NOTHING`으로 중복을 방지합니다.

### 채팅방 검색

- `/chat/search?query=검색어`에서 제목 검색과 방장 닉네임 검색을 섹션으로 나누어 표시합니다.
- 검색 결과는 `search_chat_rooms` RPC와 `useInfiniteQuery`로 페이지 단위 조회하고, 각 섹션은 더보기 버튼으로 다음 페이지를 불러옵니다.

---

## 디렉토리 구조

```text
src/
├── actions/               # Server Actions (auth, channel, chat-room, common, donations, following, live, message, profile)
├── app/                   # Next.js App Router
│   ├── api/               # Route Handler (auth/withdraw, payments/toss)
│   ├── auth/              # 로그인, 회원가입, OAuth callback, 프로필 완성
│   ├── channel/           # 크리에이터 채널 관리 (live, chat, security, donation, analytics)
│   ├── chat/              # 채팅방 목록, 상세, 검색
│   ├── live/              # 라이브 목록, 시청, 검색, OBS 오버레이
│   └── user/              # 프로필, 팔로잉, 후원
├── components/            # 도메인별 UI (auth, channel, chat-room, chat-room-list, common,
│                          #   donations, following, live, preview, search, setting, ui)
├── constants/             # 도메인별 상수와 Query Key Factory
├── hooks/                 # 도메인별 custom hooks (조회/뮤테이션/UI 로직)
├── lib/
│   ├── framer-motion/     # Motion animation preset
│   ├── supabase/          # browser, server, admin client, proxy
│   └── zod/               # Zod schema
├── mock/                  # 개발용 mock 데이터
├── stores/                # Zustand stores
├── types/                 # 도메인 타입과 Supabase 생성 타입(database.types.ts)
└── utils/                 # 도메인 보조 유틸과 서버 snapshot helper
```

- 라우트 전용 서버 데이터 페칭 함수는 라우트 폴더의 `_data/` 프라이빗 폴더에 둡니다. (예: `app/channel/chat/_data/`, `app/live/[creatorId]/_data/`)
- 자세한 폴더 규칙은 `.agents/code-convention/SRP_CONVENTION.md`를 참고합니다.

---

## 데이터베이스

### 테이블

| 테이블                        | 설명                                                           |
| ----------------------------- | -------------------------------------------------------------- |
| `user`                        | 서비스 유저 프로필. Supabase Auth user id와 동일한 `id`를 사용 |
| `chat_room`                   | 채팅방 메타데이터, 정원, 현재 참여자 수                        |
| `chat_room_member`            | 채팅방 참여 상태, 강퇴 여부, 마지막 입장·읽음 시각             |
| `message`                     | 채팅 메시지와 시스템 메시지                                    |
| `creator_studio_setting`      | 크리에이터 채널 설정(채팅·보안 key 버전·후원·알림 등)          |
| `live_broadcast`              | 라이브 방송과 시청자·채팅·후원 통계                            |
| `live_message`                | 라이브 채팅·후원·운영 알림 메시지                              |
| `live_poll`, `live_poll_vote` | 라이브 투표와 투표 기록                                        |
| `donation`                    | 후원 기록(금액, 후원자, 익명 여부, 지갑 거래 연결)             |
| `wallet_account`              | 사용자 포인트 지갑 잔액                                        |
| `wallet_transaction`          | 충전·후원·환불 등 지갑 거래 내역                               |
| `viewer_creator_relation`     | 팔로잉 관계와 채팅 규칙 동의 버전                              |

### Enum

| Enum                        | 값                                           |
| --------------------------- | -------------------------------------------- |
| `gender`                    | `male`, `female`, `none`                     |
| `oauth_provider`            | `google`, `github`, `email`                  |
| `message_type`              | `text`, `system`                             |
| `live_chat_scope`           | `authenticated`, `follower`, `manager`       |
| `live_message_type`         | `chat`, `moderation_notice`, `donation`      |
| `wallet_transaction_type`   | `charge`, `donation_spend`, `refund`         |
| `wallet_transaction_status` | `pending`, `succeeded`, `failed`, `canceled` |

### RPC

| 도메인        | 함수                                                                                                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 인증/프로필   | `check_email_exists`                                                                                                                                                                                                                               |
| 채팅방        | `create_chat_room`, `get_chat_room_list`, `get_chat_room_detail`, `get_public_chat_room_metadata`, `join_chat_room`, `leave_chat_room`, `mark_room_read`, `kick_chat_room_member`, `transfer_chat_room_owner`, `search_chat_rooms`                 |
| 메시지        | `send_chat_message`                                                                                                                                                                                                                                |
| 라이브        | `get_landing_snapshot`, `get_live_hero`, `get_live_list`, `get_live_popular_keywords`, `search_live_results`, `get_live_watch`, `get_live_watch_count`, `start_live_broadcast`, `end_live_broadcast`, `send_live_message`, `accept_live_chat_rule` |
| 오버레이      | `get_live_chat_overlay_snapshot`, `get_live_donation_alert_overlay_snapshot`                                                                                                                                                                       |
| 투표          | `create_live_poll`, `end_live_poll`, `vote_live_poll`                                                                                                                                                                                              |
| 채널/스튜디오 | `get_creator_studio_snapshot`, `upsert_creator_studio_setting`, `rotate_live_security_token_version`, `get_creator_donation_dashboard`                                                                                                             |
| 팔로잉        | `follow_creator`, `unfollow_creator`, `get_following_channel_list`                                                                                                                                                                                 |
| 후원/지갑     | `send_live_donation`, `confirm_wallet_charge`, `get_user_donation_snapshot`                                                                                                                                                                        |

쓰기 RPC는 클라이언트에서 직접 호출하지 않고 Server Action이 인증 사용자 id를 확인한 뒤 `service_role` 경계로 호출합니다. 읽기 RPC는 실행 권한에 따라 브라우저 client(TanStack Query) 또는 Server Component(SSR)에서 호출합니다. read 전략 기준은 `.agents/supabase-convention/SKILLS.md` 4장을 따릅니다.

### Supabase Storage

| 버킷         | 경로                            | 용도             |
| ------------ | ------------------------------- | ---------------- |
| `user-media` | `{user.id}/avatar/avatar.{ext}` | 유저 프로필 사진 |
| `user-media` | `{user.id}/banner/{name}.{ext}` | 채널 홈 배너     |
| `user-media` | `{user.id}/live-thumbnail/...`  | 라이브 썸네일    |

모든 유저 미디어를 단일 공개 버킷 `user-media`에 `{user.id}/{카테고리}/` 구조로 저장합니다. storage RLS는 본인 폴더(`foldername[1] = auth.uid()`)로만 제한하며(이미지 표시는 공개 CDN URL로 처리되어 SELECT 정책 불필요), 유저 삭제 시 `delete-user-storage` Edge Function이 `{user.id}/` 하위를 재귀적으로 정리합니다. 프로필 이미지는 `upsert`로 처리하고 확장자가 달라져 남은 파일을 정리하며, 공개 URL에는 캐시 갱신을 위해 `?t={Date.now()}` 쿼리를 붙입니다.

### DB Triggers

| 트리거                                                    | 설명                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| `trigger_insert_date_divider_message`                     | 매일 첫 메시지 INSERT 시 날짜 구분 system 메시지를 자동 삽입 |
| `trigger_insert_chat_room_member_system_message`          | 채팅방 참여/나가기 시 system 메시지를 자동 삽입              |
| `trigger_update_member_count`                             | 멤버 변경 시 채팅방 현재 인원 수를 갱신                      |
| `trigger_check_capacity_on_rejoin`                        | 재입장 시 정원 초과를 검증                                   |
| `trigger_delete_empty_chat_room`                          | 멤버가 모두 나간 채팅방을 정리                               |
| `increment_live_broadcast_message_count_on_live_message`  | 라이브 메시지 INSERT 시 방송 채팅 수를 증가                  |
| `increment_live_broadcast_donation_stats_on_donation`     | 후원 발생 시 방송 후원 합계·횟수를 증가                      |
| `sync_live_broadcast_peak_viewer_count_on_live_broadcast` | 현재 시청자 수 변경 시 최고 시청자 수를 동기화               |
| `set_*_modified_at`                                       | 각 테이블의 `modified_at` 타임스탬프 자동 갱신               |

### 스키마 변경 절차

Supabase 스키마나 RPC를 수정할 때는 대시보드 SQL Editor로 적용한 뒤 동일한 SQL을 `supabase/migrations/`에 파일로 기록하고, 타입을 갱신합니다.

```bash
npm run db:types
```

- migration 파일명은 `YYYYMMDDHHMMSS_작업_내용.sql` 형식이며, 파일의 version 접두사는 원격 `schema_migrations` 이력과 일치해야 합니다.
- 마이그레이션은 도메인별로 채팅(`~20260519`), 라이브·채널·후원(`20260527~`)으로 누적되어 있습니다. 전체 목록은 `supabase/migrations/`를 기준으로 확인합니다.
- 적용·기록 규칙의 상세는 `.agents/supabase-convention/SKILLS.md`를 참고합니다.

---

## 상태 관리와 캐싱

- 인증 세션은 `useAuthStore`가 관리하고 `AuthListener`가 Supabase 세션 변화를 동기화합니다.
- 채팅방 목록 탭, 정렬값, 검색어는 `useChatRoomStore`가, 라이브 목록 필터·정렬·표시 개수는 `useLiveStore`가 관리합니다.
- 서버 데이터는 TanStack Query로 관리하고, Server Action 호출의 pending·toast·router 이동·query invalidation은 `src/hooks/{domain}`의 도메인별 mutation hook에서 처리합니다.
- 헤더 사용자 계정 메뉴와 설정 사이드바는 표시용 프로필 snapshot을 Server Component 경계에서 받아 사용하며, 프로필 수정과 OAuth unlink 후에는 `router.refresh()`로 갱신합니다.
- Query Key는 `src/constants/common/query-keys.ts`의 `QUERY_KEYS`를 기준으로 생성합니다.
- Supabase 스키마 타입은 `src/types/database.types.ts`를 기준으로 사용하며, DB 스키마 변경이 있을 때만 `npm run db:types`로 갱신합니다.

---

## 앱 메시지와 에러 처리

- 사용자에게 노출되는 toast, alert, error UI 문구는 `APP_MESSAGE`와 `APP_MESSAGE_CODE`로 관리합니다.
- Zod와 React Hook Form의 필드 오류 문구는 `FORM_MESSAGE`로 분리합니다.
- Supabase, Auth, DB 원본 에러는 `console.error`에만 남기고 사용자 UI에는 고정 메시지 코드를 표시합니다.
- empty state, 버튼 라벨, 일반 안내 문구는 전역 에러 메시지 대상에서 제외하고 해당 컴포넌트의 UI 문구로 유지합니다.

---

## 실시간 처리

현재 앱은 Supabase Realtime의 Postgres Changes, Presence, Broadcast를 사용합니다.

- 채팅방의 `message` INSERT 이벤트로 새 메시지를, `chat_room_member` 변경 이벤트로 참여자 목록·방 정보·목록 count를 갱신합니다.
- 강퇴 상태는 현재 유저의 `chat_room_member.is_banned` 변경을 감지해 UI에 반영합니다.
- 라이브 OBS 오버레이는 `live_message` INSERT 이벤트로 채팅·후원 알림을 실시간 반영합니다.
- Presence는 채팅방 접속 상태 표시 전용으로 사용하며, 권한 판단이나 DB 저장에는 사용하지 않습니다.
- Broadcast는 채팅방 typing indicator 표시 전용으로 사용하고 DB에는 저장하지 않습니다.

# PixelPlay

실시간 채팅 플랫폼으로 시작해 향후 라이브 스트리밍 서비스로 확장할 계획인 웹 애플리케이션입니다.

Next.js 16 App Router, React 19, Supabase Auth/Postgres/Realtime, TanStack Query, Zustand를 중심으로 인증, 채팅방 목록, 채팅방 상세, 메시지, 참여자 관리, 채팅방 검색 기능을 제공합니다.

현재 쓰기 작업은 Server Action에서 인증 사용자를 확인한 뒤 Supabase `service_role` 경계로 RPC를 호출하는 방식으로 통일되어 있습니다. 클라이언트 컴포넌트는 TanStack Query mutation hook으로 pending 상태와 후처리를 관리합니다.

---

## 기술 스택

| 분류              | 기술                                                 |
| ----------------- | ---------------------------------------------------- |
| Framework         | Next.js 16 App Router, React 19, TypeScript strict   |
| Styling           | Tailwind CSS 4, shadcn, Base UI, lucide-react        |
| Auth              | Supabase Auth, Email OTP, Google OAuth, GitHub OAuth |
| Database          | Supabase Postgres                                    |
| Realtime          | Supabase Realtime Postgres Changes                   |
| Server State      | TanStack Query v5                                    |
| Client State      | Zustand v5                                           |
| Form / Validation | react-hook-form v7, Zod v4                           |
| Theme             | next-themes                                          |
| Formatter         | Prettier, prettier-plugin-tailwindcss                |

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

| 변수                                   | 설명                                                 |
| -------------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase 프로젝트 URL                                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key                             |
| `SUPABASE_SERVICE_ROLE_KEY`            | 회원 탈퇴 등 관리자 작업에 사용하는 service role key |

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

브라우저에서 <http://localhost:3000>에 접속합니다. 비로그인 상태에서는 `/auth/login`으로 이동합니다.

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
| `npm run types`        | Supabase 타입을 `src/types/database.types.ts`로 재생성 |

---

## 주요 기능

### 인증

- 이메일 OTP 인증 후 비밀번호와 프로필을 완성하는 회원가입 흐름을 제공합니다.
- 이메일과 비밀번호 기반 로그인을 제공합니다.
- 회원가입과 새 비밀번호 변경은 Supabase Auth 정책과 맞춰 최소 8자, 영문 소문자, 영문 대문자, 숫자, 특수문자를 요구합니다.
- 닉네임은 2자 이상 10자 이하의 영문, 숫자, 한글만 허용하며 공백과 특수문자는 사용할 수 없습니다.
- 로그인과 현재 비밀번호 확인은 기존 계정 호환을 위해 비밀번호 입력 여부만 검증하고, 실제 인증은 Supabase Auth에 위임합니다.
- Google, GitHub OAuth 로그인과 추가 프로필 입력 흐름을 제공합니다.
- OAuth 연동 계정 목록을 `linked_providers`로 관리합니다.
- 로그인 상태는 Supabase 세션을 기준으로 검증하고 `AuthListener`가 Zustand store에 동기화합니다.
- 프로필이 없는 로그인 유저는 `/auth/complete-profile`로 이동합니다.
- 비로그인 유저는 보호 라우트 접근 시 `/auth/login`으로 이동합니다.
- 비밀번호 변경, 프로필 수정, 프로필 이미지 업로드와 삭제, 회원 탈퇴 API를 제공합니다.
- 로그인, OAuth 로그인, 회원가입 OTP, 닉네임 확인, 프로필 완성, 프로필 수정, 로그아웃은 mutation hook으로 호출 상태와 toast, router 이동, query invalidation을 관리합니다.
- 제출, 취소, 닫기, 링크 이동 같은 UI 동작은 같은 busy 상태를 기준으로 잠겨 중복 요청을 방지합니다.

### 메인 화면

- 좌측 사이드바에서 채팅과 라이브 메뉴를 전환합니다.
- 현재 라이브 메뉴는 준비 상태 화면을 제공합니다.
- 모바일에서는 사이드바가 offcanvas 형태로 동작합니다.
- 헤더 검색 입력은 채팅 메뉴에서 채팅방 검색 페이지로 이동합니다.

### 채팅방 목록

- `JOINED`, `NOT_JOINED`, `OWNED` 탭으로 채팅방 목록을 분리합니다.
- 채팅방 목록은 `get_chat_room_list` RPC로 탭별 개수와 목록 데이터를 함께 조회합니다.
- `get_chat_room_list`는 unread_count, 정렬, 번호형 페이지네이션, 탭 내 검색, total_count를 한 응답으로 처리합니다.
- 정렬 옵션은 생성일 최신순, 최신 메시지순, 참여자 많은순을 제공합니다.
- 참여 가능한 채팅방 탭에서는 최신 메시지순을 노출하지 않습니다.
- 탭 변경 시 정렬값과 검색어는 기본값으로 초기화합니다.
- `ChatRoomSearchInput`으로 현재 탭 내에서 채팅방 제목을 필터링할 수 있습니다. 검색 중에는 탭 badge가 `total_count`로 오버라이드됩니다.
- 채팅방 목록은 `useQuery`와 `keepPreviousData` 기반 번호형 페이지네이션으로 조회합니다.
- 페이지네이션은 `ChatRoomPagination`에서 이전/다음, 페이지 번호, 줄임표를 표시하며 마지막 페이지의 다음 버튼은 1페이지로 순환합니다.
- `NOT_JOINED` 탭에서는 정원이 마감된 채팅방을 제외합니다 (`current_member < max_capacity`).
- 채팅방 카드에는 제목, 설명, 방장 닉네임, 현재 인원, 최대 인원, 생성일을 표시합니다.
- 채팅방 생성 Dialog에서 제목, 설명, 정원을 입력해 방을 만들 수 있습니다.
- 채팅방 생성은 `createChatRoomAction`이 `create_chat_room` RPC를 호출하는 방식으로 처리합니다.
- 생성 중에는 submit, 취소, 닫기, overlay, ESC 닫기가 같은 busy 상태로 잠깁니다.

### 채팅방 상세

- `/chat-room/[roomId]` 라우트에서 채팅방 상세 화면을 제공합니다.
- 방 정보, 참여자 목록, 메시지 목록, 메시지 입력 영역을 렌더링합니다.
- 방 정보, 현재 유저 멤버십, 활성 참여자 목록은 `get_chat_room_detail` RPC로 함께 조회합니다.
- 미참여 유저가 진입하면 `JoinChatRoomDialog`가 표시됩니다. 정원 마감 상태에서는 참여 불가 안내만 표시합니다 (destructive 색상). 참여 완료 후 Realtime으로 자동 상태 전환됩니다.
- 참여자 목록은 활성 멤버만 표시합니다.
- 방장은 참여자 Popover에서 강퇴와 방장 권한 위임을 실행할 수 있습니다.
- 강퇴된 유저는 Realtime 이벤트로 감지되어 입력이 잠기고 안내 Dialog가 표시됩니다.
- 일반 참여자는 채팅방 메뉴에서 나가기를 실행할 수 있습니다.
- 방장은 현재 정책상 채팅방 나가기가 제한됩니다.
- 참여, 나가기, 읽음 처리, 강퇴, 방장 위임은 Server Action과 RPC를 통해 처리합니다.
- 참여 및 멤버 액션 pending 중에는 관련 다이얼로그 닫기와 중복 클릭을 방지합니다.

### 메시지

- 메시지 목록은 `useInfiniteQuery`로 최신 메시지부터 조회합니다.
- 상단 근접 시 이전 메시지를 추가로 가져옵니다.
- 새 메시지는 Supabase Realtime `postgres_changes` INSERT 이벤트를 받아 React Query cache에 `created_at desc` 순서로 병합합니다.
- 텍스트 메시지는 `sendMessageAction`이 `send_chat_message` RPC를 호출하는 방식으로 전송하고 이모지 입력을 제공합니다.
- 메시지 입력은 auto-resize `textarea`로 구현합니다. 최대 높이는 `max-h-32`이며 초과 시 스크롤됩니다. Shift+Enter는 줄바꿈, Enter는 전송입니다.
- 멀티라인 메시지는 `whitespace-pre-wrap`으로 렌더링합니다.
- 날짜 구분 시스템 메시지는 PostgreSQL AFTER INSERT Trigger(`trigger_insert_date_divider_message`)가 매일 첫 text 메시지 INSERT 시 `📅 YYYY년 MM월 DD일 요일` 형식의 system 메시지를 1ms 앞 타임스탬프로 자동 삽입합니다.
- 날짜 구분 메시지는 partial unique index와 `ON CONFLICT DO NOTHING`으로 같은 방, 같은 날짜 중복 생성을 방지합니다.
- 프론트는 `SystemMessageItem`에서 lucide Calendar 아이콘으로 날짜 구분 메시지를 렌더링합니다.
- 시스템 메시지는 별도 컴포넌트로 렌더링합니다.

### 채팅방 검색

- `/search/chat?query=검색어` 라우트에서 채팅방 검색 결과를 제공합니다.
- 제목 검색과 방장 닉네임 검색을 섹션으로 나누어 표시합니다.
- 검색 결과는 `search_chat_rooms` RPC와 `useInfiniteQuery`로 페이지 단위 조회합니다.
- 각 섹션은 더보기 버튼으로 다음 페이지를 불러옵니다.

---

## 디렉토리 구조

```text
src/
├── actions/              # Server Actions
├── app/                  # Next.js App Router
│   ├── (settings)/       # 설정 라우트 그룹
│   ├── api/              # Route Handler
│   ├── auth/             # 인증 라우트
│   ├── chat-room/[roomId]/ # 채팅방 상세
│   └── search/chat/      # 채팅방 검색
├── components/
│   ├── auth/             # 로그인, 회원가입, OAuth, 비밀번호 UI
│   ├── chat-room/        # 채팅방 상세, 메시지, 참여자 관리 UI
│   ├── chat-room-list/   # 채팅방 목록, 카드, 생성 Dialog
│   ├── common/           # Header, Footer, Providers, Sidebar
│   ├── live/             # 라이브 준비 화면
│   ├── search/           # 검색 입력과 검색 결과
│   ├── setting/          # 프로필 설정
│   └── ui/               # shadcn / Base UI 기반 공통 컴포넌트
├── constants/            # 상수와 Query Key Factory
├── hooks/
│   ├── auth/             # 인증 mutation 훅
│   ├── chat-room/        # 채팅방 조회, 참여, 멤버 액션, Realtime 훅
│   ├── common/           # 반응형, observer 등 공통 훅
│   ├── message/          # 메시지 조회와 전송 훅
│   ├── profile/          # 프로필 조회, 수정, 닉네임 확인 훅
│   └── search/           # 검색 결과 조회 훅
├── lib/
│   ├── supabase/         # browser, server, admin client
│   ├── utils/            # 공통 유틸
│   └── zod/              # Zod schema
├── mock/                 # 개발용 mock 데이터
├── stores/               # Zustand stores
├── types/                # 도메인 타입과 Supabase 생성 타입
└── utils/                # 표시용 유틸
```

---

## 데이터베이스

### 주요 테이블

| 테이블             | 설명                                                                          |
| ------------------ | ----------------------------------------------------------------------------- |
| `user`             | 서비스 유저 프로필. Supabase Auth user id와 동일한 `id`를 사용합니다.         |
| `chat_room`        | 채팅방 메타데이터와 정원, 현재 참여자 수를 저장합니다.                        |
| `chat_room_member` | 채팅방 참여 상태, 강퇴 여부, 마지막 입장 시각, 마지막 읽음 시각을 저장합니다. |
| `message`          | 채팅 메시지와 시스템 메시지를 저장합니다.                                     |

### 주요 컬럼

`user`.

| 컬럼                        | 설명                             |
| --------------------------- | -------------------------------- |
| `id`                        | Auth user id와 동일한 uuid       |
| `email`                     | 이메일                           |
| `name`                      | 실명                             |
| `nickname`                  | 서비스 표시 이름                 |
| `birth`                     | 생년월일                         |
| `phone`                     | 휴대전화번호                     |
| `gender`                    | `male`, `female`, `none`         |
| `photo_url`                 | 프로필 이미지 URL                |
| `linked_providers`          | `google`, `github`, `email` 배열 |
| `created_at`, `modified_at` | 생성, 수정 시각                  |

`chat_room`.

| 컬럼                        | 설명                |
| --------------------------- | ------------------- |
| `id`                        | 채팅방 uuid         |
| `owner_id`                  | 방장 `user.id`      |
| `title`                     | 제목                |
| `description`               | 설명                |
| `max_capacity`              | 최대 인원           |
| `current_member`            | 현재 활성 참여자 수 |
| `created_at`, `modified_at` | 생성, 수정 시각     |

`chat_room_member`.

| 컬럼             | 설명             |
| ---------------- | ---------------- |
| `id`             | 멤버 row uuid    |
| `chat_room_id`   | 채팅방 id        |
| `user_id`        | 유저 id          |
| `last_joined_at` | 마지막 입장 시각 |
| `last_read_at`   | 마지막 읽음 시각 |
| `is_banned`      | 강퇴 여부        |
| `created_at`     | 생성 시각        |

`message`.

| 컬럼                        | 설명             |
| --------------------------- | ---------------- |
| `id`                        | 메시지 uuid      |
| `chat_room_id`              | 채팅방 id        |
| `user_id`                   | 작성자 id        |
| `content`                   | 메시지 내용      |
| `message_type`              | `text`, `system` |
| `created_at`, `modified_at` | 생성, 수정 시각  |

### RPC

| 함수                       | 용도                                                                     |
| -------------------------- | ------------------------------------------------------------------------ |
| `check_email_exists`       | 이메일 중복 확인                                                         |
| `create_chat_room`         | 채팅방 생성과 생성자 멤버십 생성을 단일 트랜잭션으로 처리                |
| `get_chat_room_list`       | 탭/count/정렬/페이지네이션/탭 내 검색/unread_count 통합 채팅방 목록 조회 |
| `get_chat_room_detail`     | 채팅방 정보, 현재 유저 멤버십, 활성 참여자 목록 통합 조회                |
| `join_chat_room`           | 채팅방 참여                                                              |
| `leave_chat_room`          | 채팅방 나가기                                                            |
| `mark_room_read`           | 방 읽음 처리                                                             |
| `send_chat_message`        | 활성 참여자의 텍스트 메시지 전송                                         |
| `search_chat_rooms`        | 채팅방 제목, 방장 닉네임 검색                                            |
| `kick_chat_room_member`    | 방장의 참여자 강퇴                                                       |
| `transfer_chat_room_owner` | 방장 권한 위임                                                           |

쓰기 RPC는 클라이언트에서 직접 호출하지 않고 Server Action이 인증 사용자 id를 확인한 뒤 `service_role` 경계로 호출합니다. 읽기 정책은 채팅방 목록, 상세, 메시지 조회와 Realtime 구독을 위해 유지합니다.

### Supabase Storage

| 버킷       | 경로                             | 용도             |
| ---------- | -------------------------------- | ---------------- |
| `profiles` | `avatars/{user.id}/avatar.{ext}` | 유저 프로필 사진 |

프로필 이미지 업로드는 `upsert`로 처리하고, 확장자가 달라져 남은 파일은 정리합니다. 공개 URL에는 캐시 갱신을 위해 `?t={Date.now()}` 쿼리를 붙입니다.

### DB Triggers

| 트리거                                           | 설명                                                                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `trigger_insert_date_divider_message`            | text 메시지 INSERT 시 해당 날짜(KST) 첫 메시지이면 날짜 구분 system 메시지를 자동 삽입합니다. 중복 방지는 partial unique index로 처리합니다. |
| `trigger_insert_chat_room_member_system_message` | 채팅방 참여/나가기 시 system 메시지를 자동 삽입합니다.                                                                                       |

### 스키마 변경 절차

Supabase 스키마나 RPC를 수정한 뒤에는 migration 파일을 추가하고 타입을 갱신합니다.

```bash
npm run types
```

현재 저장소의 `supabase/migrations/` 에 포함된 주요 migration 파일은 다음과 같습니다.

| 파일                                                                  | 내용                                    |
| --------------------------------------------------------------------- | --------------------------------------- |
| `20260506021151_create_kv_table_55ce40ce.sql`                         | KV 테이블 생성                          |
| `20260507053827_add_pagination_to_get_rooms_by_tab.sql`               | 채팅방 목록 페이지네이션 추가           |
| `20260507060357_mark_room_read_rpc.sql`                               | `mark_room_read` RPC 추가               |
| `20260507064503_drop_paginated_get_rooms_by_tab.sql`                  | 기존 페이지네이션 RPC 제거              |
| `20260507074832_leave_chat_room_rpc.sql`                              | `leave_chat_room` RPC 추가              |
| `20260511012256_trigger_update_member_count_add_last_joined_at.sql`   | 멤버 수 트리거 및 `last_joined_at` 추가 |
| `20260511032318_create_join_chat_room_rpc.sql`                        | `join_chat_room` RPC 추가               |
| `20260511033426_fix_join_chat_room_return_type.sql`                   | `join_chat_room` 반환 타입 수정         |
| `20260511052223_update_join_chat_room_rpc_active_member_policy.sql`   | 활성 멤버 정책 반영                     |
| `20260511052342_drop_old_join_chat_room_rpc.sql`                      | 구 `join_chat_room` RPC 제거            |
| `20260511061734_join_chat_room_security_definer.sql`                  | security definer 적용                   |
| `20260511075805_add_get_rooms_by_tab_count.sql`                       | `get_rooms_by_tab_count` 추가           |
| `20260512123000_update_get_rooms_by_tab_sort.sql`                     | 채팅방 목록 정렬 RPC 업데이트           |
| `20260514000000_update_get_rooms_by_tab_count_add_sort.sql`           | 정렬 옵션 통합                          |
| `20260514010000_update_get_rooms_by_tab_count_add_pagination.sql`     | 페이지네이션 통합                       |
| `20260514020000_drop_old_get_rooms_by_tab_count_overload.sql`         | 구 오버로드 제거                        |
| `20260514030000_replace_join_chat_room_rpc.sql`                       | `join_chat_room` RPC 교체               |
| `20260515000000_get_rooms_by_tab_count_add_query.sql`                 | 탭 내 검색 파라미터 추가                |
| `20260515010000_get_rooms_by_tab_count_fix_unread_and_full_room.sql`  | unread 계산 및 정원 마감 필터 수정      |
| `20260515020000_insert_date_divider_message_trigger.sql`              | 날짜 구분 system 메시지 트리거 추가     |
| `20260516000000_refactor_chat_room_rpc_concurrency.sql`               | 채팅방 RPC 동시성 제어 정리             |
| `20260516070131_restrict_chat_room_rpc_execute.sql`                   | 채팅방 RPC 실행 권한 정리               |
| `20260516070741_restrict_member_management_rpc_to_service_role.sql`   | 참여자 관리 RPC 실행 경계 강화          |
| `20260516072941_restrict_advisor_security_definer_rpc.sql`            | Advisor 대상 RPC 권한 정리              |
| `20260516093908_add_chat_room_list_rpc.sql`                           | 채팅방 목록 RPC 통합                    |
| `20260516113108_add_chat_room_detail_rpc.sql`                         | 채팅방 상세 RPC 추가                    |
| `20260516121058_drop_unused_chat_room_legacy_rpcs.sql`                | 미사용 채팅방 목록 RPC 제거             |
| `20260516230042_fix_chat_room_performance_advisor.sql`                | 채팅방 DB 성능 Advisor 정리             |
| `20260516234000_add_send_chat_message_rpc.sql`                        | 메시지 전송 RPC와 본문 DB 제약 추가     |
| `20260517220049_restrict_chat_room_write_access.sql`                  | 채팅 테이블 직접 쓰기 권한 폐쇄         |
| `20260517220610_harden_date_divider_trigger_search_path.sql`          | 날짜 구분 trigger 함수 search_path 보강 |
| `20260517220803_restrict_write_rpc_execute_to_service_role.sql`       | 쓰기 RPC 실행 경계 service role로 정리  |
| `20260517231746_harden_message_send_and_date_divider_concurrency.sql` | 메시지 전송과 날짜 구분 동시성 보강     |

---

## 상태 관리와 캐싱

- 인증 세션은 `useAuthStore`가 관리합니다.
- 메인 메뉴 선택 상태는 `useMainMenuStore`가 관리합니다.
- 채팅방 목록 탭, 정렬값, 검색어(`searchQuery`)는 `useChatRoomStore`가 관리합니다. 탭 변경 시 정렬값과 검색어가 함께 초기화됩니다.
- 서버 데이터는 TanStack Query로 관리합니다.
- Server Action 호출의 pending, toast, router 이동, query invalidation은 `src/hooks/{domain}`의 도메인별 mutation hook에서 관리합니다.
- Query Key는 `src/constants/query-keys.ts`의 `QUERY_KEYS`를 기준으로 생성합니다.
- Supabase 스키마 타입은 `src/types/database.types.ts`를 기준으로 사용합니다.

---

## 실시간 처리

현재 앱은 Supabase Realtime의 Postgres Changes를 사용합니다.

- `message` INSERT 이벤트로 새 메시지를 목록에 반영합니다.
- 메시지 Realtime 병합은 최신순 정렬을 유지해 `flex-col-reverse` 레이아웃에서도 새로고침 전후 날짜 구분 위치가 일관되도록 처리합니다.
- `chat_room_member` 변경 이벤트로 참여자 목록, 방 정보, 목록 count를 갱신합니다.
- 강퇴 상태는 현재 유저의 `chat_room_member.is_banned` 변경을 감지해 UI에 반영합니다.

Broadcast와 Presence는 아직 제품 기능으로 사용하지 않습니다.

---

## 남은 작업

- 라이브 스트리밍 메뉴는 아직 준비 상태입니다.
- 메시지 수정/삭제 기능이 미구현 상태입니다.

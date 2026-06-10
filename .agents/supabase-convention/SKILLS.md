# Supabase Convention

이 문서는 PixelPlay 프로젝트에서 Supabase를 다룰 때 준수해야 하는 규칙입니다.

## 1. 데이터베이스 타입 동기화

데이터베이스 스키마 변경이 발생하면 반드시 로컬의 TypeScript 타입을 업데이트해야 합니다.

- **명령어**: `npm run db:types`
- **설명**: `package.json`에 정의된 스크립트를 사용하여 Supabase 프로젝트로부터 최신 타입을 가져옵니다.
- **주기**: 테이블 추가, 컬럼 수정, 함수(RPC) 생성 등 스키마 변화가 있을 때마다 즉시 실행하십시오.

## 2. 데이터베이스 변경과 Migration 최신화

프로젝트의 복잡도를 낮추고 신속한 개발을 위해 실제 적용은 Supabase 대시보드를 우선 활용합니다.

- **적용 방법**: Supabase 대시보드의 **SQL Editor**를 사용하여 테이블 생성, 수정, RPC 함수 정의 등을 수행하십시오.
- **기록 원칙**: SQL Editor로 적용한 스키마 변경은 작업 완료 전 반드시 `supabase/migrations`에 SQL 파일로 최신화합니다.
- **파일명**: `YYYYMMDDHHMMSS_작업_내용.sql` 형식으로 작성합니다.
- **대상**: 테이블 추가, 컬럼 수정, 함수(RPC) 생성/수정, 트리거 변경 등 DB 스키마 또는 DB 로직 변화가 모두 포함됩니다.
- **주의**: migration 파일은 실제 적용된 SQL과 동등해야 하며, 이후 `npm run db:types`로 타입을 갱신합니다.
- **검증 단계**: PR 제출 전 로컬 스키마와 `supabase/migrations` SQL 파일이 동등한지 diff/검증 명령으로 확인하고, 문제가 없으면 `npm run db:types`를 실행합니다.

## 3. RPC 및 로직 위치

- 비즈니스 로직이 데이터베이스 계층에서 처리되는 것이 효율적일 경우(예: 복잡한 필터링, 트랜잭션 처리) PostgreSQL 함수(RPC)를 적극 활용하십시오.
- 동시성 문제가 발생될 것 같은 부분은 사용자에게 상의후에 적용할지 말지 결정하십시오.
- `src/lib/supabase/client.ts` 및 `server.ts`를 통해 생성된 클라이언트를 사용하여 데이터에 접근하십시오.

## 4. 데이터 read 전략과 RPC 실행 권한

read(조회)를 **어디서 실행할지는 RPC의 실행 권한(grant)과 보안 모델에 따라 결정**합니다. 모든 read를 무조건 TanStack Query로 통일하지 않습니다.

### 4.1 브라우저 client read — TanStack Query 훅

- 대상 RPC/테이블이 `authenticated`에 `grant`되어 있고, RLS로 본인 데이터만 접근하도록 보호되는 경우 사용합니다.
- 브라우저 client(`src/lib/supabase/client.ts`)로 `useQuery`의 `queryFn`에서 직접 `.rpc()` 또는 `.from()`을 호출합니다.
- 예: `useUser`(public.user 조회), `useChatRoomList`(`get_chat_room_list`).
- 장점: 캐시 공유로 props drilling 회피, mutation 후 `invalidateQueries`로 즉시 갱신.

### 4.2 서버 전용 read — Server Component 페칭 (SSR)

- 대상 RPC가 `authenticated`/`anon`에서 `revoke`되고 `service_role`에만 `grant`된 경우, **브라우저에서 호출 자체가 불가능**합니다.
- 이런 RPC는 보통 `security definer`이고 `p_actor_user_id` 같은 **신뢰 파라미터**를 받습니다. 브라우저에 열면 다른 유저 id를 넣어 조회할 수 있어, **의도적으로 서버 전용으로 잠근 보안 설계**입니다.
  - 예: `get_creator_studio_snapshot`은 `revoke ... from authenticated` + `grant ... to service_role`로 잠겨 있음.
- 따라서 admin client(`createAdminClient`)로 **서버에서** 호출하고, `auth.getUser()`로 검증한 실제 user id를 파라미터로 넘깁니다.
- 이 read는 Server Component에서 수행하며 **TanStack Query 훅으로 옮기지 마십시오.** 옮기려면 RPC를 `auth.uid()` 기반으로 재설계하고 grant/RLS를 바꿔야 하므로, 보안 재검토가 선행되지 않으면 보안이 약화됩니다.

### 4.3 서버 read 파일 위치

- 특정 라우트 전용 서버 데이터 페칭 함수는 해당 라우트의 **`_data/` 프라이빗 폴더**에 둡니다. (`_` 접두사라 Next.js 라우팅 대상에서 제외됨)
  - 예: `app/channel/chat/_data/channel-chat-data.ts`, `app/live/[creatorId]/_data/live-overlay-data.ts`.
- 라우트에 종속되지 않고 여러 곳에서 재사용하는 서버 read 헬퍼는 `utils/{domain}/`에 둡니다.
  - 예: `utils/profile/profile-server.ts`(`getCurrentProfileSnapshot`).
- 라우트 폴더에 `data.ts`를 그대로 노출하지 않습니다.

# Supabase Convention

이 문서는 PixelPlay 프로젝트에서 Supabase를 다룰 때 준수해야 하는 규칙입니다.

## 1. 데이터베이스 타입 동기화

데이터베이스 스키마 변경이 발생하면 반드시 로컬의 TypeScript 타입을 업데이트해야 합니다.

- **명령어**: `npm run types`
- **설명**: `package.json`에 정의된 스크립트를 사용하여 Supabase 프로젝트로부터 최신 타입을 가져옵니다.
- **주기**: 테이블 추가, 컬럼 수정, 함수(RPC) 생성 등 스키마 변화가 있을 때마다 즉시 실행하십시오.

## 2. 데이터베이스 변경과 Migration 최신화

프로젝트의 복잡도를 낮추고 신속한 개발을 위해 실제 적용은 Supabase 대시보드를 우선 활용합니다.

- **적용 방법**: Supabase 대시보드의 **SQL Editor**를 사용하여 테이블 생성, 수정, RPC 함수 정의 등을 수행하십시오.
- **기록 원칙**: SQL Editor로 적용한 스키마 변경은 작업 완료 전 반드시 `supabase/migrations`에 SQL 파일로 최신화합니다.
- **파일명**: `YYYYMMDDHHMMSS_작업_내용.sql` 형식으로 작성합니다.
- **대상**: 테이블 추가, 컬럼 수정, 함수(RPC) 생성/수정, 트리거 변경 등 DB 스키마 또는 DB 로직 변화가 모두 포함됩니다.
- **주의**: migration 파일은 실제 적용된 SQL과 동등해야 하며, 이후 `npm run types`로 타입을 갱신합니다.
- **검증 단계**: PR 제출 전 로컬 스키마와 `supabase/migrations` SQL 파일이 동등한지 diff/검증 명령으로 확인하고, 문제가 없으면 `npm run types`를 실행합니다.

## 3. RPC 및 로직 위치

- 비즈니스 로직이 데이터베이스 계층에서 처리되는 것이 효율적일 경우(예: 복잡한 필터링, 트랜잭션 처리) PostgreSQL 함수(RPC)를 적극 활용하십시오.
- 동시성 문제가 발생될 것 같은 부분은 사용자에게 상의후에 적용할지 말지 결정하십시오.
- `src/lib/supabase/client.ts` 및 `server.ts`를 통해 생성된 클라이언트를 사용하여 데이터에 접근하십시오.

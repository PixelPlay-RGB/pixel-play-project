# 검증 규칙

이 문서는 PixelPlay 프로젝트에서 빌드, 타입 생성, 린트, 포맷, Git 작업을 검증할 때 반복 실패를 줄이기 위한 실행 규칙입니다.

## 1. Windows npm 실행 규칙

- 이 프로젝트의 기본 OS는 Windows입니다.
- PowerShell에서 `npm`, `npx`를 직접 호출하지 않습니다.
- 검증 명령은 아래 실행 파일을 명시적으로 사용합니다.
  - `C:\Program Files\nodejs\npm.cmd`
  - `C:\Program Files\nodejs\npx.cmd`
- 이유는 PowerShell이 `npm.ps1`, `npx.ps1`을 먼저 잡으면 잘못된 전역 prefix를 따라가며 `npm-cli.js`, `npx-cli.js`를 찾지 못하는 실패가 반복되기 때문입니다.

## 2. 처음부터 권한 상승으로 실행할 명령

아래 명령은 이 프로젝트에서 반복적으로 sandbox 또는 네트워크 제한에 걸린 이력이 있으므로 처음부터 권한 상승으로 실행합니다.

- `npm run types`.
  - `npx supabase gen types`가 npm registry 또는 Supabase 원격 프로젝트에 접근합니다.
- `npm run build`.
  - Next.js `next/font`가 Google Fonts를 fetch합니다.
- `git add`.
  - `.git/index.lock` 생성이 sandbox 권한에 막힌 이력이 있습니다.
- `git commit`.
  - `.git` 내부 메타데이터 쓰기가 필요합니다.

## 3. 일반 권한으로 먼저 실행할 명령

아래 명령은 로컬 파일 검사 중심이므로 일반 권한으로 먼저 실행합니다.

- `npm run format:check`.
- `npm run lint`.
- 특정 파일에 대한 `prettier --write`.
- `git status`, `git diff`, `git log`, `git show`.

일반 권한으로 실패했는데 원인이 파일 쓰기, 네트워크, Git index 권한이면 같은 명령을 반복하지 말고 즉시 권한 상승으로 재실행합니다.

## 4. 검증 순서

코드, 타입, hook, Server Action, Supabase 타입, 라우트, 공용 컴포넌트가 바뀐 경우 아래 순서로 검증합니다.

1. `npm run types`.
2. `npm run format:check`.
3. `npm run lint`.
4. `npm run build`.

문서만 바뀐 경우에는 `npm run format:check`만 실행할 수 있습니다.

## 5. Supabase 검증 규칙

- Supabase RPC, RLS, table, trigger, function이 바뀌면 MCP `execute_sql`로 원격 상태를 확인합니다.
- RPC 변경 후에는 `pg_proc`, 권한, `search_path`, `security invoker/definer`, `anon/authenticated/service_role` 실행 권한을 확인합니다.
- 제약 조건 변경 후에는 `pg_constraint`에서 실제 적용 여부를 확인합니다.
- Advisor 확인 시 무료 플랜 제약으로 해결할 수 없는 `Leaked Password Protection Disabled`는 별도 수정 대상으로 보지 않습니다.
- Performance Advisor는 남은 경고가 있는지 확인합니다.

## 6. 실패 보고 규칙

- 같은 명령을 같은 권한으로 반복 실행하지 않습니다.
- 실패 시 원인을 `권한`, `네트워크`, `코드 오류`, `포맷 오류`, `환경 문제` 중 하나로 분류합니다.
- 권한 또는 네트워크 문제로 확인된 경우 다음 시도는 권한 상승으로 실행합니다.
- 검증을 생략한 경우 완료 보고에 생략 이유를 명시합니다.

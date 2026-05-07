# supabase 문서

## 파일 경로
- `src/lib/client.ts`
- `src/lib/middleware.ts`

## 파일 설명
- `client.ts`는 브라우저 환경에서 사용할 Supabase 클라이언트를 생성해.
- `middleware.ts`는 서버 요청 시 세션 업데이트와 인증 상태 체크 역할을 가져.
- 현재 채팅 UI에는 Supabase 조회/저장/Reatime 연동이 아직 연결되지 않았어.

## Props 타입 설명
- 일반 컴포넌트 Props는 없고, 유틸 함수 중심 구조야.

## 주요 함수/훅 설명
- `createClient()` (`client.ts`) - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 기반 클라이언트 생성.
- `updateSession(request)` (`middleware.ts`) - 쿠키/세션 업데이트 및 인증 흐름 처리.

## 사용 예시
```ts
import { createClient } from "@/lib/client"

const supabase = createClient()
const { data, error } = await supabase.from("message").select("*")
```

# 채널 후원·보안 페이지 기획 문서

## 목적

`/channel/donation`과 `/channel/security` 두 페이지를 먼저 실제 기능 페이지로 만들기 위한 기획이다.

현재 브랜치의 `/channel/live`는 MediaMTX HLS 미리보기를 로컬 하드코딩 URL로 붙여둔 상태이며, 운영 단계에서는 방송인별 서버 URL과 스트림키를 제공해야 한다. 이 문서는 기존 Supabase 테이블과 RPC를 최대한 활용하되, 기존 구조로 부족한 부분은 DB 변경 필요 항목으로 분리한다.

## 현재 확인된 상태

### 프론트 라우트

| 경로                | 현재 상태                        | 우선 구현 목표                                        |
| ------------------- | -------------------------------- | ----------------------------------------------------- |
| `/channel/donation` | placeholder 텍스트만 렌더링      | 후원 설정, 알림 설정, 정산 요약, 후원 내역을 보여준다 |
| `/channel/security` | 공용 placeholder 컴포넌트 렌더링 | 스트림키, 채팅 오버레이 키, 후원 알림 키를 관리한다   |

### 관련 DB 테이블

| 테이블                   | 현재 용도                                                            | 두 페이지에서의 사용                                                          |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `creator_studio_setting` | 방송 기본 설정, 채팅 규칙, 후원 설정, 데모 정산 정보, 토큰 버전 저장 | 후원 설정 저장과 보안 키 버전 표시                                            |
| `donation`               | 방송별 후원 기록                                                     | 후원 내역, 월별 합계, 총 후원액 조회                                          |
| `wallet_account`         | 사용자 지갑 잔액                                                     | 후원자 지갑 기능에 사용하며, 크리에이터 후원 페이지에서는 직접 사용 비중 낮음 |
| `wallet_transaction`     | 충전, 후원 사용, 환불 트랜잭션                                       | 후원 결제와 환불 추적                                                         |
| `live_broadcast`         | 방송 세션과 방송별 집계                                              | 후원 내역의 방송 제목, 방송별 후원 집계                                       |

### 관련 RPC

| RPC                                  | 현재 권한      | 활용 페이지                                   | 판단                                   |
| ------------------------------------ | -------------- | --------------------------------------------- | -------------------------------------- |
| `get_creator_donation_dashboard`     | `service_role` | `/channel/donation`                           | 후원 대시보드 조회에 사용 가능         |
| `upsert_creator_studio_setting`      | `service_role` | `/channel/donation`, `/channel/security` 일부 | 후원 설정 저장에 사용 가능             |
| `rotate_live_security_token_version` | `service_role` | `/channel/security`                           | 키 재발급 UI의 버전 증가에는 사용 가능 |
| `send_live_donation`                 | `service_role` | 시청자 후원 플로우                            | 채널 관리 페이지 직접 기능은 아님      |
| `confirm_wallet_charge`              | `service_role` | 시청자 지갑 충전 플로우                       | 채널 관리 페이지 직접 기능은 아님      |

기존 프로젝트 패턴상 `service_role` RPC는 클라이언트에서 직접 호출하지 않고 Server Action이나 Route Handler로 감싼다.

## `/channel/donation` 기획

### 페이지 목표

크리에이터가 후원 기능을 켜고 끄고, 최소 후원 금액과 알림 방식을 설정하며, 월별 후원 현황과 후원 내역을 확인하는 페이지다.

### MVP 화면 구성

| 영역             | 주요 내용                                             | 데이터 출처                      |
| ---------------- | ----------------------------------------------------- | -------------------------------- |
| 후원 상태 카드   | 후원 활성화 여부, 최소 후원 금액, 금액 공개 여부      | `creator_studio_setting`         |
| 알림 설정 카드   | 후원 알림 사용, 사운드 사용, 볼륨, TTS 사용, TTS 속도 | `creator_studio_setting`         |
| 정산 요약 카드   | 정산 상태, 정산 예정 금액, 은행명, 예금주             | 현재는 `settlement_demo`         |
| 월별 요약        | 선택 연도와 월의 후원 건수, 총액, 월별 그래프 데이터  | `get_creator_donation_dashboard` |
| 후원 내역 테이블 | 방송 제목, 후원자, 금액, 메시지, 시간, 상태           | `get_creator_donation_dashboard` |

### 사용자 액션

| 액션                     | 동작                                         | RPC 또는 API                     |
| ------------------------ | -------------------------------------------- | -------------------------------- |
| 후원 활성화 토글         | 후원을 받을지 여부를 저장한다                | `upsert_creator_studio_setting`  |
| 최소 후원 금액 변경      | 1,000원부터 1,000,000원 사이 값으로 저장한다 | `upsert_creator_studio_setting`  |
| 후원 금액 공개 여부 변경 | 채팅과 알림에 금액을 표시할지 저장한다       | `upsert_creator_studio_setting`  |
| 알림과 TTS 설정 변경     | 알림 사운드, 볼륨, TTS 설정을 저장한다       | `upsert_creator_studio_setting`  |
| 기간 필터 변경           | 연도와 월 기준으로 후원 내역을 다시 조회한다 | `get_creator_donation_dashboard` |

### 데이터 흐름

```txt
page.tsx
-> Server Component에서 actor 확인
-> getCreatorDonationDashboardAction 호출
-> RPC get_creator_donation_dashboard
-> ChannelDonationPage 컴포넌트 렌더링
```

설정 저장은 다음 흐름으로 처리한다.

```txt
폼 입력
-> donation settings Server Action
-> Zod 검증
-> upsert_creator_studio_setting RPC
-> /channel/donation revalidate
```

### 기존 DB와 RPC로 가능한 범위

현재 구조만으로도 아래 기능은 구현 가능하다.

- 후원 활성화 여부 저장.
- 최소 후원 금액 저장.
- 후원 금액 공개 여부 저장.
- 후원 알림, 사운드, 볼륨, TTS, TTS 속도 저장.
- 연도와 월 기준 후원 합계 조회.
- 후원 내역 조회.
- 데모 정산 정보 표시.

### DB 또는 RPC 변경이 필요한 범위

아래 기능은 기존 구조에 한계가 있다.

| 필요한 기능                | 현재 한계                                               | 제안 변경                                         |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| 실제 정산 계좌 관리        | `settlement_demo`가 jsonb 데모 데이터다                 | `creator_settlement_account` 테이블 추가          |
| 정산 요청과 지급 상태 추적 | 정산 요청 테이블이 없다                                 | `creator_settlement_payout` 테이블 추가           |
| 후원 알림 테스트 발송      | 저장 RPC는 있으나 테스트 이벤트 RPC가 없다              | `test_donation_alert` RPC 또는 Route Handler 추가 |
| 후원 환불과 취소 처리      | `wallet_transaction` 상태는 있으나 후원 환불 RPC가 없다 | `refund_live_donation` RPC 추가                   |

## `/channel/security` 기획

### 페이지 목표

크리에이터가 방송 송출과 오버레이에 필요한 민감 키를 확인하고 재발급하는 페이지다.

이 페이지는 “운영용 URL 표시”와 “키 재발급”이 핵심이다. 실제 키 원문은 보안상 DB에 그대로 저장하지 않는 방향을 기본으로 한다.

### MVP 화면 구성

| 영역              | 주요 내용                                        | 데이터 출처                               |
| ----------------- | ------------------------------------------------ | ----------------------------------------- |
| RTMP 송출 설정    | OBS 서버 URL, 스트림 키, OBS 입력 안내           | 신규 스트림키 테이블 또는 임시 환경 설정  |
| 스트림키 관리     | 키 복사, 키 숨김, 재발급, 마지막 변경일          | 신규 스트림키 테이블 필요                 |
| 오버레이 URL 관리 | 채팅 오버레이 URL, 후원 알림 URL, 버전 표시      | 현재는 `creator_studio_setting` 버전 컬럼 |
| 보안 안내         | 키 유출 시 재발급 안내, 송출 중 재발급 주의 문구 | 정적 UI                                   |

### 사용자 액션

| 액션                    | 동작                                     | RPC 또는 API                         |
| ----------------------- | ---------------------------------------- | ------------------------------------ |
| 스트림키 복사           | 현재 키를 클립보드에 복사한다            | 프론트 동작                          |
| 스트림키 재발급         | 기존 키를 무효화하고 새 키를 발급한다    | 신규 RPC 필요                        |
| 채팅 오버레이 키 재발급 | `chat_overlay_version`을 증가시킨다      | `rotate_live_security_token_version` |
| 후원 알림 키 재발급     | `donation_alert_version`을 증가시킨다    | `rotate_live_security_token_version` |
| OBS 설정 보기           | 서버 URL과 스트림 키를 분리해서 보여준다 | 환경 변수와 DB 조합                  |

### OBS 설정 표시 방식

운영 환경에서는 모든 사용자에게 같은 MediaMTX 서버 URL을 보여준다.

```txt
서버 URL: rtmp://media.pixelplay.com:1935/live
스트림 키: {channelSlug}?token={streamSecret}
```

OBS가 실제로 송출하는 주소는 아래처럼 조합된다.

```txt
rtmp://media.pixelplay.com:1935/live/{channelSlug}?token={streamSecret}
```

MediaMTX HTTP 인증 API에서는 아래 값으로 검증한다.

```txt
action = publish
protocol = rtmp
path = live/{channelSlug}
query = token={streamSecret}
```

이 방식은 HLS 시청 URL에 비밀 키를 노출하지 않는 장점이 있다.

```txt
시청 URL: https://media.pixelplay.com/live/{channelSlug}/index.m3u8
```

### 기존 DB와 RPC로 가능한 범위

현재 구조만으로 가능한 기능은 제한적이다.

- `stream_key_version`, `chat_overlay_version`, `donation_alert_version` 표시.
- `rotate_live_security_token_version`으로 세 종류 키의 버전 증가.
- 서버 URL을 환경 변수로 표시.
- OBS 설정 안내 UI 표시.

### DB 또는 RPC 변경이 필요한 범위

스트림키를 사용자별로 실제 운영하려면 DB 변경이 필요하다.

| 필요한 기능                | 현재 한계                                             | 제안 변경                                                                |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| 사용자별 스트림키 저장     | 실제 키 또는 키 해시 저장 테이블이 없다               | `creator_stream_key` 테이블 추가                                         |
| 스트림키 검증              | MediaMTX가 물어볼 인증 API와 RPC가 없다               | `verify_stream_publish` RPC 또는 `/api/mediamtx/auth` Route Handler 추가 |
| 스트림키 재발급            | 현재 RPC는 버전만 올리고 새 secret을 만들지 않는다    | `rotate_creator_stream_key` RPC 추가                                     |
| 키 마지막 사용 시간        | MediaMTX publish 성공 기록 테이블이 없다              | `stream_publish_event` 테이블 추가                                       |
| 송출 경로와 채널 slug 매핑 | `user.nickname`은 있으나 별도 채널 slug 테이블이 없다 | `creator_channel` 또는 `channel_profile` 테이블 검토                     |

### 제안 DB 변경안

스트림키 운영을 위해 다음 테이블을 추가하는 방향을 추천한다.

```sql
create table public.creator_stream_key (
  creator_id uuid primary key references public."user"(id) on delete cascade,
  channel_slug text not null unique,
  key_hash text not null,
  key_preview text not null,
  version integer not null default 1,
  last_used_at timestamp with time zone,
  rotated_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  modified_at timestamp with time zone not null default now()
);
```

`key_preview`는 UI에서 `sk_...abcd`처럼 일부만 보여주기 위한 값이다. `key_hash`는 원문 secret을 저장하지 않기 위한 값이다.

MediaMTX 인증을 위해서는 Route Handler가 더 현실적이다.

```txt
POST /api/mediamtx/auth
-> MediaMTX payload 수신
-> action, protocol, path, query 검증
-> streamSecret hash 비교
-> 200 또는 403 응답
```

이 API 내부에서 RPC를 쓰고 싶다면 `verify_stream_publish` 함수를 둘 수 있다.

```sql
verify_stream_publish(
  p_path text,
  p_token text,
  p_protocol text
) returns uuid
```

반환값은 인증된 `creator_id`로 둔다. 실패 시 `PX401`, `PX403`, `PX404` 계열 에러를 던져 앱 메시지와 로그에서 구분한다.

## 구현 우선순위

1. `/channel/donation`은 기존 `creator_studio_setting`과 `get_creator_donation_dashboard`를 사용해 먼저 구현한다.
2. `/channel/security`는 서버 URL 표시와 오버레이 키 버전 재발급 UI를 먼저 구현한다.
3. 실제 사용자별 스트림키 발급은 DB 변경 후 구현한다.
4. MediaMTX HTTP auth 연동은 AWS MediaMTX 서버가 준비된 뒤 붙인다.

## 권장 파일 구조

```txt
src/app/channel/donation/page.tsx
src/components/channel/donation/channel-donation-page.tsx
src/components/channel/donation/channel-donation-settings-panel.tsx
src/components/channel/donation/channel-donation-summary-panel.tsx
src/components/channel/donation/channel-donation-history-table.tsx
src/actions/channel/donation.ts
src/lib/zod/channel-donation.ts

src/app/channel/security/page.tsx
src/components/channel/security/channel-security-page.tsx
src/components/channel/security/channel-security-stream-key-panel.tsx
src/components/channel/security/channel-security-overlay-panel.tsx
src/actions/channel/security.ts
src/lib/zod/channel-security.ts
```

두 페이지 모두 Server Action은 `getAuthenticatedActorId`와 `createAdminClient`를 사용한다. 기존 RPC 권한이 `service_role` 중심이므로 브라우저 클라이언트에서 직접 호출하지 않는다.

## 검증 계획

- Zod 스키마 단위 테스트 또는 최소 타입 검증을 추가한다.
- Server Action은 잘못된 입력, 미인증 사용자, RPC 실패를 각각 확인한다.
- 페이지 구현 후 `npm run typecheck`, `npm run lint`, `npm run build`를 실행한다.
- DB 변경이 포함되는 단계에서는 migration 파일 작성 후 `npm run db:types`를 실행한다.

## 결정 사항

- `/channel/donation`은 기존 DB와 RPC로 MVP 구현이 가능하다.
- `/channel/security`는 UI 일부는 가능하지만 실제 스트림키 운영은 DB와 인증 API 추가가 필요하다.
- 스트림키 원문은 DB에 저장하지 않고 해시만 저장한다.
- MediaMTX 서버 URL은 환경 변수로 관리하고, 스트림키는 사용자별 DB 값으로 관리한다.

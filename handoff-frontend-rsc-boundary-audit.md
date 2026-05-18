# PixelPlay 프론트엔드 RSC 경계 감사

작성 기준일은 2026년 5월 18일입니다.
대상 브랜치는 `refactor/project-wide/#65`입니다.

## 목적

이번 문서는 프론트엔드 리팩토링을 시작하기 전에 Next.js App Router 기준으로 Server Component, Client Component, Server Action, Route Handler, hook, 컴포넌트 분리 후보를 정리하기 위한 감사 기록입니다.

핵심 기준은 SRP 단독 적용이 아닙니다.
컴포넌트를 무조건 작게 쪼개는 대신, 서버에서 처리할 수 있는 데이터와 보안 경계를 서버로 두고, 클라이언트에는 사용자 입력, 브라우저 API, Realtime, 스크롤, drag and drop, local draft 같은 상호작용 상태만 남기는 방향을 우선합니다.

## 감사 기준

| 기준                       | 판단 방식                                                                               | 적용 방향                                                     |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Server Component 후보      | DB read, auth gate, profile gate, 정적 shell, 초기 route 판단                           | page, layout, server helper에서 처리합니다.                   |
| Client Component 유지 후보 | `useState`, `useEffect`, 이벤트 핸들러, 브라우저 API, Realtime, TanStack Query 상호작용 | 클라이언트에 유지합니다.                                      |
| Server Action 후보         | 인증 사용자 확인이 필요한 mutation, DB write, Storage write, Auth write                 | 클라이언트 직접 호출 대신 action 또는 route handler로 둡니다. |
| hook 분리 후보             | 같은 상태 전이 반복, 컴포넌트 렌더링을 읽기 어렵게 만드는 effect, query/mutation 후처리 | 서버 컴포넌트 전환과 무관하면 우선순위를 낮춥니다.            |
| 컴포넌트 분리 후보         | 반복 UI/UX, 독립적인 dialog, 독립적인 field group, 서로 다른 렌더링 책임                | props drilling이 늘어나지 않는 범위에서만 분리합니다.         |
| 유지 후보                  | form workflow 자체, 단일 화면 전용 짧은 handler, shadcn/ui 래퍼, 자동 생성 타입         | 줄 수만으로 분리하지 않습니다.                                |

## 전체 구조 판정

| 영역                          | 현재 역할                                              | 판정                                                                                  |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `src/app`                     | route, layout, server page, route handler              | 큰 방향은 좋습니다. 일부 page에서 서버 profile read를 더 활용할 여지는 있습니다.      |
| `src/actions`                 | Server Action과 service role RPC 호출                  | 보안 경계는 좋지만 `auth.ts`가 과밀합니다. 파일 분리는 조직화 목적입니다.             |
| `src/components`              | UI와 클라이언트 상호작용                               | 대부분 도메인별로 나뉘었지만 auth/profile/message 일부가 상태 전이를 많이 가집니다.   |
| `src/hooks`                   | TanStack Query, mutation, Realtime, client auth 후처리 | 전반적으로 맞습니다. 다만 hook으로 빼도 서버화되지 않는 후보는 신중히 봐야 합니다.    |
| `src/constants`               | 도메인 상수와 메시지                                   | 중앙 메시지 사전은 큰 파일이어도 현재는 유지 대상입니다.                              |
| `src/utils`                   | parser, 순수 함수, query helper                        | 좋은 위치입니다. 일부 컴포넌트 내부 pure helper는 필요할 때만 이동합니다.             |
| `src/stores`                  | Zustand auth, chat room, main menu 상태                | `isCanChangePassword`는 서버 또는 profile query에서 파생할 수 있어 재검토 대상입니다. |
| `src/components/ui`           | shadcn/Base UI 래퍼                                    | 규모가 크더라도 이번 도메인 리팩토링 대상에서 제외합니다.                             |
| `src/types/database.types.ts` | Supabase 생성 타입                                     | 자동 생성 파일이므로 제외합니다.                                                      |

## 주요 발견 사항

### P1. `AuthListener`의 역할이 과합니다.

현재 `src/components/auth/auth-listener.tsx`는 세션 동기화, query invalidation, `linked_providers` 조회, email provider 보정 update, 비밀번호 변경 가능 여부 store 반영을 모두 합니다.

이 파일은 화면을 렌더링하지 않는 클라이언트 컴포넌트이므로, 세션 이벤트를 구독하는 역할만 남기는 편이 좋습니다.
특히 `public.user` update는 클라이언트 listener에서 수행하기보다 OAuth callback, 회원가입 완료, OAuth profile 완료, OAuth unlink 같은 서버 경계에서 끝내는 것이 맞습니다.

권장 방향은 다음과 같습니다.

- `AuthListener`는 `supabase.auth.onAuthStateChange`, `getUser`, Zustand `user`, query invalidation만 담당합니다.
- `linked_providers` 보정은 `src/app/auth/callback/route.ts`와 `src/actions/auth.ts`의 서버 흐름에서 처리합니다.
- `isCanChangePassword`는 전역 store에서 보관하지 말고 profile data의 `linked_providers.includes("email")`에서 파생합니다.

### P1. 비밀번호 변경 흐름의 Auth write 경계를 서버로 더 모을 수 있습니다.

`src/components/auth/password/password-change-form.tsx`는 `changePasswordAction` 호출 후 클라이언트에서 `supabase.auth.signOut()`을 직접 호출합니다.

새 비밀번호 변경 자체는 이미 Server Action입니다.
비밀번호 변경 후 로그아웃도 같은 보안 경계에서 처리할 수 있으므로, Server Action이 password update와 sign out을 함께 처리하고 클라이언트는 toast, dialog close, router refresh만 담당하는 구조가 더 일관적입니다.

### P1. Header, Profile, Setting의 profile data 사용이 중복됩니다.

`Header`는 서버에서 auth user와 profile 존재 여부를 확인합니다.
그런데 `HeaderProfileBadge`, `SettingSidebar`, `ProfileProvidersCard`, `ProfileForm`은 다시 클라이언트에서 `useUser` 또는 Zustand 파생 상태를 사용합니다.

중복 조회 자체가 항상 문제는 아니지만, 현재 `isCanChangePassword`가 `AuthListener`에 의해 별도 store로 유지되는 점은 구조를 복잡하게 만듭니다.

권장 방향은 다음과 같습니다.

- 단기적으로는 `isCanChangePassword` store를 제거하고 `HeaderProfileBadge`, `SettingSidebar`가 profile query에서 직접 계산합니다.
- 장기적으로는 Header와 Settings layout에서 서버 profile snapshot을 내려주고, profile update와 OAuth link/unlink 후 `router.refresh()`로 RSC shell을 갱신하는 구조를 검토합니다.
- 단, 이 전환은 TanStack Query 캐시와 RSC refresh가 섞이므로 별도 작업으로 분리합니다.

### P1. `src/actions/auth.ts`는 보안 경계는 맞지만 파일 책임이 과밀합니다.

현재 `auth.ts`에는 로그인, OTP, 회원가입, 현재 비밀번호 확인, 비밀번호 변경, OAuth profile 완료, OAuth unlink, profile update가 함께 있습니다.

이 파일은 서버 경계에 있으므로 당장 클라이언트 보안 문제는 아닙니다.
다만 다음 작업자가 읽기 어렵고 변경 충돌이 생기기 쉬우므로 기능 단위로 분리하는 것이 좋습니다.

권장 분리 단위는 다음과 같습니다.

- 인증 진입과 OTP.
- 회원가입과 OAuth profile 완료.
- 비밀번호 확인과 변경.
- OAuth link, unlink 보조.
- profile update와 avatar storage 처리.

### P2. Form 컴포넌트는 무리하게 분해하지 않습니다.

`signup-form`, `complete-profile-form`, `profile-form`은 줄 수가 길지만 form workflow 자체가 하나의 기능입니다.
이 파일들을 field 단위로 무조건 쪼개면 props 전달과 React Hook Form context 의존성이 늘어날 수 있습니다.

대신 다음 조건을 만족할 때만 분리합니다.

- 같은 UI/UX가 두 곳 이상 반복됩니다.
- 같은 상태 전이가 두 곳 이상 반복됩니다.
- 렌더링보다 데이터 조립이나 side effect가 더 커집니다.
- 분리해도 FormProvider 또는 가까운 직접 prop 전달로 충분하고 다단계 props drilling이 생기지 않습니다.

현재는 닉네임 중복확인 상태 전이가 `signup-form`, `complete-profile-form`, `profile-form`에 반복됩니다.
이 부분은 `useNicknameAvailability` 같은 hook으로 분리할 가치가 있습니다.
반면 전체 form section을 여러 파일로 나누는 작업은 우선순위가 낮습니다.

### P2. 메시지 입력과 목록은 클라이언트 유지가 맞지만 hook 분리 이득이 있습니다.

`message-list`는 스크롤 anchoring, 이전 메시지 prefetch, `flex-col-reverse` 구조를 다룹니다.
`message-input`은 textarea auto resize, draft, keyboard submit, zod 검증, mutation을 다룹니다.

둘 다 서버 컴포넌트로 옮길 수 있는 성격은 아닙니다.
다만 스크롤 anchoring과 textarea auto resize는 UI 렌더링과 별개로 독립 검증이 가능한 동작이므로 hook 분리 이득이 있습니다.

권장 방향은 다음과 같습니다.

- `useMessageScrollAnchor`로 `message-list`의 ref와 `useLayoutEffect`를 분리합니다.
- `useAutoResizeTextarea` 또는 `useMessageDraft`로 textarea 높이와 draft 조작을 분리합니다.
- 낙관적 업데이트 작업과 충돌할 수 있으므로 메시지 입력 hook 분리는 팀원 작업 병합 이후로 미룹니다.

### P2. 채팅방 목록 탭과 페이지네이션은 작은 UI 분리 후보입니다.

`chat-room-list-tabs`는 모바일 dropdown, 데스크톱 tabs, count badge, overflow tooltip을 한 파일에서 처리합니다.
`chat-room-list-pagination`은 페이지 계산은 util로 빠져 있지만 순환 이전/다음 핸들러와 렌더링이 같이 있습니다.

서버 컴포넌트 전환 후보는 아닙니다.
다만 count badge, mobile tab selector, desktop tab selector 정도는 반복 UI가 아니더라도 파일 가독성 측면에서 분리할 수 있습니다.
우선순위는 auth/profile 경계 정리보다 낮습니다.

### P2. Setting menu renderer는 context별 렌더링이 한 함수에 섞여 있습니다.

`src/components/setting/setting-menu-item.tsx`는 popover context와 sidebar context를 한 renderer 함수에서 switch로 처리합니다.

현재 동작은 맞지만, context가 늘어나면 분기가 더 커질 수 있습니다.
`SettingPopoverMenuItem`과 `SettingSidebarMenuItem`으로 나누면 props 의미가 더 명확해집니다.
다만 이 작업은 보안이나 서버 경계와 직접 관련이 없으므로 후순위입니다.

### P3. 컴포넌트 내부 전용 함수와 상수는 기준을 정해 분리합니다.

다음 항목은 단독으로는 큰 문제가 아닙니다.

- `OwnerBadge`, `MemberContent`.
- `StepBadge`.
- `EmptySearchResult`.
- `ChatRoomListTabCountBadge`.
- `resolveSearchPath`.
- `TOP_PREFETCH_PX`, `MAX_TEXTAREA_HEIGHT_PX`, `DATE_DIVIDER_PREFIX`.

분리 기준은 재사용이 아니라 변경 이유입니다.
DB, Zod, UI, 메시지 포맷과 동시에 맞아야 하는 값은 `constants`로 옮기고, 순수 계산 함수는 `utils`로 옮깁니다.
반대로 해당 컴포넌트를 읽는 데 필요한 작은 presentational subcomponent는 같은 파일에 남겨도 됩니다.

## props drilling 점검

현재 심각한 props drilling은 보이지 않습니다.

| 흐름                                                         | 현재 상태                                          | 판정                                                      |
| ------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------- |
| `ChatRoom`에서 `roomId` 전달                                 | header, message, member, dialog로 1에서 2단계 전달 | 식별자 전달이라 허용합니다.                               |
| `ChatRoomHeader`의 `onOpenMembers`                           | sheet open 제어를 1단계 전달                       | local UI state라 허용합니다.                              |
| `JoinChatRoomDialog`, `MemberActionAlertDialog` pending 전달 | dialog 내부 pending guard                          | 허용합니다.                                               |
| `SettingMenuItemRenderer`의 `isCanChangePassword`            | header popover와 sidebar에서 전달                  | derived store 의존이 문제이며 props 깊이는 크지 않습니다. |
| `ProfileAvatarUpload`의 `disabled`, `onFileChange`           | profile form에서 1단계 전달                        | 허용합니다.                                               |

문제는 깊은 props 전달보다, 일부 derived state가 전역 store에 올라가거나 클라이언트 listener에서 DB와 auth side effect를 함께 처리하는 점입니다.

## 서버 컴포넌트 전환 후보

| 후보                                      | 가능성        | 메모                                                                                                                                   |
| ----------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `HeaderProfileBadge` 초기 profile 표시    | 중간          | Header 서버 조회 결과를 prop으로 넘기면 초기 중복 profile query를 줄일 수 있습니다. profile update 후 `router.refresh()`가 필요합니다. |
| Settings layout의 비밀번호 변경 가능 여부 | 중간          | 서버 layout에서 profile을 읽어 `SettingShell`에 prop으로 넘길 수 있습니다. OAuth link/unlink 후 refresh 정책이 필요합니다.             |
| Profile page 초기 profile data            | 낮음에서 중간 | editable form과 avatar preview는 client 유지가 맞습니다. initial data만 서버에서 줄 수 있지만 TanStack Query와 중복 설계가 됩니다.     |
| Chat search initial page                  | 낮음          | infinite query와 load more가 있어 client 유지가 단순합니다.                                                                            |
| Chat room list/detail                     | 낮음          | Realtime, Zustand tab state, infinite messages, membership state 때문에 client 유지가 맞습니다.                                        |
| Auth forms                                | 낮음          | React Hook Form, OTP, nickname check, pending guard 때문에 client 유지가 맞습니다.                                                     |

## 권장 작업 순서

### 1단계. Auth provider와 password 경계 정리

목표는 `AuthListener`에서 DB profile 조회와 update를 제거하고, 비밀번호 변경 후 sign out을 Server Action 경계로 옮기는 것입니다.

작업 후보는 다음과 같습니다.

- `AuthListener`를 세션 동기화와 query invalidation 전용으로 축소합니다.
- `linked_providers` 보정이 필요한 경우 OAuth callback 또는 Server Action 쪽에서 처리합니다.
- `isCanChangePassword` Zustand state를 제거하거나 deprecated 대상으로 표시하고 profile data에서 파생합니다.
- `changePasswordAction`이 비밀번호 변경과 sign out을 함께 수행하도록 정리합니다.

### 2단계. Header와 Settings의 profile 파생 상태 정리

목표는 profile derived state를 한 경계에서 계산하게 만드는 것입니다.

작업 후보는 다음과 같습니다.

- Header popover와 Settings sidebar의 비밀번호 메뉴 노출 조건을 `linked_providers.includes("email")` 기준으로 통일합니다.
- 서버 prop 전환은 바로 하지 않고, 먼저 client query 기반 중복 store 제거를 완료합니다.
- 이후 실제 중복 fetch가 체감되면 Header와 Settings layout의 서버 snapshot 전달을 별도 작업으로 검토합니다.

### 3단계. Auth/Profile form의 반복 상태 전이만 최소 분리

목표는 form 자체를 해체하지 않고 반복되는 닉네임 중복확인 흐름만 줄이는 것입니다.

작업 후보는 다음과 같습니다.

- `signup-form`, `complete-profile-form`, `profile-form`의 nickname availability 상태 전이를 hook으로 통합합니다.
- FormProvider 기반 section 분리는 하지 않습니다.
- field UI 분리는 같은 필드 UX가 세 곳 이상 반복되거나 변경 요구가 생길 때만 진행합니다.

### 4단계. 메시지 UI hook 분리

목표는 메시지 낙관적 업데이트와 충돌하지 않게 스크롤과 textarea 동작을 분리하는 것입니다.

작업 후보는 다음과 같습니다.

- 팀원 낙관적 업데이트 브랜치를 확인한 뒤 `message-input`과 `message-list`를 분리합니다.
- `useMessageScrollAnchor`, `useAutoResizeTextarea`는 client-only hook으로 둡니다.
- `send_chat_message`와 Realtime 정렬 경계는 유지합니다.

### 5단계. UI 가독성 정리

목표는 반복 UI 또는 context별 renderer만 정리하는 것입니다.

작업 후보는 다음과 같습니다.

- `setting-menu-item`을 popover/sidebar renderer로 나눕니다.
- `chat-room-list-tabs`의 badge와 mobile/desktop selector를 분리합니다.
- `chat-room-list-pagination`의 순환 page 이동 계산을 util로 보냅니다.
- `MemberItem`, `PasswordDialog`, `ChatSearchResults`의 작은 내부 subcomponent는 변경 요구가 생기기 전까지 유지합니다.

## 이번 감사의 결론

첫 구현 작업은 컴포넌트 분해가 아니라 `AuthListener`, `isCanChangePassword`, `password-change-form` 경계 정리부터 시작하는 것이 가장 좋습니다.

그 이유는 다음과 같습니다.

- 서버와 클라이언트 책임 경계가 실제로 흐린 지점입니다.
- DB write와 auth side effect가 클라이언트 listener 또는 form에 일부 남아 있습니다.
- 이후 Header, Settings, Profile form 리팩토링의 기준을 잡아줍니다.
- 폼을 무리하게 쪼개지 않아도 구조 개선 효과가 큽니다.

반대로 `signup-form` 같은 form workflow는 지금 당장 파일 분해부터 하지 않는 것이 맞습니다.
폼은 클라이언트 컴포넌트로 유지하고, 반복 상태 전이가 명확한 부분만 나중에 최소 분리합니다.

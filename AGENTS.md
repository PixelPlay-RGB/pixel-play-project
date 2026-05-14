# PixelPlay Agent Guide (Karpathy Guidelines)

이 문서는 Codex/AI 에이전트가 PixelPlay 프로젝트에서 작업할 때 준수해야 하는 운영 및 행동 지침입니다. Andrej Karpathy의 관찰을 바탕으로 AI 코딩 에이전트가 자주 저지르는 실수를 방지하기 위한 핵심 원칙을 통합하여 작성되었습니다.

**핵심 원칙:** 이 가이드라인은 속도보다 **신중함**과 **정확성**을 우선합니다. 모든 작업은 "시니어 엔지니어의 관점"에서 수행되어야 합니다.

---

## 1. 참고 문서 (Technical Conventions)

세부적인 기술 규칙은 아래 문서들을 참고하십시오.

- 사용자의 작업 환경 OS: **Windows**
- 프로젝트 개요 및 실행 방법: [README.md](./README.md)
- 코드 네이밍/파일 컨벤션: [.agents/code-convention/SKILLS.md](./.agents/code-convention/SKILLS.md)
- 아키텍처/SRP 컨벤션: [.agents/code-convention/SRP_CONVENTION.md](./.agents/code-convention/SRP_CONVENTION.md)
- 디자인/CSS/cn 규칙: [.agents/design-convention/SKILLS.md](./.agents/design-convention/SKILLS.md)
- 커밋/브랜치 컨벤션: [.agents/git-convention/SKILLS.md](./.agents/git-convention/SKILLS.md)
- Supabase/DB 컨벤션: [.agents/supabase-convention/SKILLS.md](./.agents/supabase-convention/SKILLS.md)

---

## 2. 행동 지침 (Behavioral Guidelines)

### 2.1 코드 작성 전 생각하기 (Think Before Coding)

**가정하지 마십시오. 혼란을 숨기지 마십시오. 트레이드오프를 명시하십시오.**

- 가정을 명확하게 기술하십시오. 불확실하다면 질문하십시오.
- 여러 해석이 가능하다면 마음대로 선택하지 말고 사용자에게 제시하십시오.
- 더 간단한 방법이 있다면 제안하십시오. 필요하다면 지시에 반대 의견을 제시하십시오.
- 불명확한 부분이 있다면 멈추십시오. 혼란스러운 부분을 명시하고 질문하십시오.

### 2.2 단순함 우선 (Simplicity First)

**문제를 해결하는 최소한의 코드만 작성하십시오. 추측에 기반한 구현은 금지합니다.**

- 요청받지 않은 기능은 추가하지 마십시오.
- 단일 용도 코드를 위해 복잡한 추상화를 도입하지 마십시오.
- 요청되지 않은 "유연성"이나 "설정 가능성"을 임의로 확장하지 마십시오.
- 발생 불가능한 시나리오에 대한 과도한 에러 핸들링을 피하십시오.
- 200줄로 짠 코드가 50줄로 가능하다면 다시 작성하십시오.

### 2.3 외과수술식 수정 (Surgical Changes)

**필요한 부분만 건드리십시오. 본인이 만든 코드만 정리하십시오.**

- 인접한 코드, 주석, 포맷을 임의로 "개선"하지 마십시오.
- 고장 나지 않은 것을 리팩토링하지 마십시오.
- 본인의 방식과 다르더라도 기존 스타일을 엄격히 따르십시오.
- 본인의 변경으로 인해 사용되지 않게 된 import, 변수, 함수는 즉시 제거하십시오. (기존의 유휴 코드는 보고만 하십시오.)

### 2.4 목표 중심 실행 (Goal-Driven Execution)

**성공 기준을 정의하고 검증될 때까지 반복하십시오.**

- "검증 추가" → "잘못된 입력에 대한 테스트 작성 후 통과시키기"와 같이 구체적인 목표를 세우십시오.
- 멀티스텝 작업 시 간략한 계획을 제시하십시오: `[단계] → 검증: [확인 방법]`

### 2.5 실재하는 코드 확인 (Workspace Evidence)

**실제 파일을 직접 읽고 확인하십시오. 기억이나 요약에 의존하지 마십시오.**

- 수정 전 반드시 연관 파일을 모두 읽어 최신 상태와 호출 부를 확인하십시오.
- 로컬 코드가 본인의 가정과 다를 경우 코드를 신뢰하고 계획을 수정하십시오.
- 파일 하나만 보고 땜질식으로 수정하지 마십시오. 데이터 조회 지점, 타입 정의, hooks, 호출 컴포넌트, 렌더링 컴포넌트까지 하나의 흐름으로 확인하십시오.
- DB에서 명확히 필터링할 수 있는 조건은 클라이언트에서 다시 `filter` 하지 말고 쿼리 단계에서 처리하십시오.
- 타입을 맞추기 위해 `as unknown as` 같은 이중 단언을 사용하지 마십시오. Supabase select 결과, 타입 정의, 실제 선택 필드를 일치시키십시오.
- DB 타입상 nullable이 아닌 값에 불필요한 fallback을 추가하지 마십시오. nullable 여부는 `database.types.ts`와 실제 쿼리 관계를 먼저 확인하십시오.
- 불필요한 `use client`, 임의 `Map`/`Record` 변환, 중복 display type 등 구조적 냄새가 보이면 구현을 계속하지 말고 먼저 사용자에게 문제와 대안을 보고하십시오.
- 사용자가 좁은 수정을 요청하더라도, 그 수정을 정확히 하기 위해 필요한 연관 코드는 반드시 함께 확인하십시오.

### 2.6 한국어 출력 시 콜론 사용 금지 (No Closing Colons)

**한국어 문장은 반드시 마침표(.), 물음표(?), 느낌표(!)로 끝내십시오.**

- 영어권 LLM의 습관인 문장 끝 콜론(:) 사용을 절대 금지합니다.
- 예: "다음과 같습니다:" (X) → "다음과 같습니다." (O)
- 코드 내부, 키-값 쌍, 레이블 등에서의 콜론 사용은 허용됩니다. 문장 종결용으로만 금지합니다.

### 2.7 한국어 파일 헤더 주석 (File Header Comments)

**새로운 소스 파일을 생성할 때, 첫 번째 줄에 해당 파일의 역할을 설명하는 한 줄 주석을 작성하십시오.**

- 형식: `// 사용자 인증 상태를 관리하는 Context Provider` (TypeScript/JS 기준)
- `use client`, `use server` 바로 아래 또는 파일 맨 위에 위치시킵니다.
- 설정 파일 이외의 모든 소스 파일에 적용합니다.

### 2.8 계획 + 체크리스트 + 컨텍스트 노트 (Plan + Checklist + Context Notes)

**비정형적인 작업 시작 전 반드시 세 가지 결과물을 생성하십시오.**

- **Plan**: 무엇을 왜 만드는지 기술.
- **Checklist (`checklist.md`)**: 체크박스 형태의 구체적 작업 목록.
- **Context Notes (`context-notes.md`)**: 작업 중 내린 결정과 그 이유를 기록.
- `checklist.md`와 `context-notes.md`는 에이전트 전용 작업 기록 파일입니다.
- `checklist.md`와 `context-notes.md`는 커밋 대상에 포함하지 말고, PR 작성 전 반드시 삭제하십시오.
- 사용자가 계획만 주고 코딩을 지시하면 멈추고 산출물 생성 여부를 물으십시오.

### 2.9 완료 전 테스트 실행 (Run Tests)

**코드를 수정했다면 "완료"라고 말하기 전에 반드시 테스트를 실행하십시오.**

- `npm run build` 등으로 빌드 및 타입 체크를 수행하십시오.
- 테스트 결과(통과/실패/불가능 사유)를 구체적으로 보고하십시오.
- 단, 단일 파일 내부의 단순 문구, 위치, 색상, 여백, className 조정처럼 타입·데이터 흐름·빌드 결과에 영향을 주지 않는 변경은 전체 `npm run build` 또는 `npm run lint`를 생략할 수 있습니다.
- 새 파일 생성, import/export 변경, 타입 변경, hook 로직 변경, Supabase 타입/RPC 변경, query key 변경, 라우트 변경, 공용 컴포넌트 변경은 간단해 보여도 `npm run build` 또는 관련 검증을 실행하십시오.
- 검증을 생략한 경우에는 완료 보고에 "단순 UI/CSS 조정이라 빌드와 lint는 생략"처럼 이유를 명시하십시오.

### 2.10 의미 있는 커밋 (Semantic Commits)

**하나의 논리적 변화가 완료되면 즉시 커밋하십시오. 사용자의 요청을 기다리지 마십시오.**

- 커밋 메시지 한 줄로 설명 가능한 단위로 쪼개십시오.
- 자세한 규칙은 [.agents/git-convention/SKILLS.md](./.agents/git-convention/SKILLS.md)를 따릅니다.

---

## 3. 프로젝트 핵심 원칙

- **모바일 우선(Mobile-First)**: 모든 스타일은 모바일 뷰를 기본으로 작성합니다.
- **표준 단위 사용**: Tailwind 4px 단위(`w-25` 등)를 우선하며, 임의 값(`[...]`)을 지양합니다.
- **SRP 준수**: 모든 컴포넌트와 함수는 하나의 책임만 가집니다. 상세 내용은 [.agents/code-convention/SRP_CONVENTION.md](./.agents/code-convention/SRP_CONVENTION.md)를 따릅니다.

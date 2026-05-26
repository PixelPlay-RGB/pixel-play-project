# PixelPlay — Visual Identity & Color System

> 상태: **확정** → `src/styles/theme.css` `:root` + `.dark` + `@theme inline` 적용 완료 <- Figma Make
> 상태: **확정** → globals.css @theme 블록 적용 완료 <- 우리 프로젝트

## 브랜드 컨셉

**"The Playground for Live Interaction"** (실시간 소통을 위한 놀이터)
역동적인 라이브 스트리밍과 실시간 채팅을 직관적이고 현대적인 인터페이스로 제공.
청정하고 안정적인 민트그린 브랜드 컬러와 고대비 다크모드 시스템.

---

## 1. Core Brand Colors

| 이름           | Light HEX | Dark HEX  | CSS 변수 (`:root`) | Tailwind 클래스 | 용도                                                 |
| -------------- | --------- | --------- | ------------------ | --------------- | ---------------------------------------------------- |
| **PIXEL_MINT** | `#46c6a9` | `#46c6a9` | `--brand`          | `bg-brand`      | 주요 CTA 버튼, 활성 상태, 브랜드 로고, 탭 하이라이트 |
| **LIVE_CORAL** | `#FF6057` | `#FF7B73` | `--live`           | `bg-live`       | 라이브 뱃지, 보조 액센트, 호버/포커스 강조           |

---

## 2. Semantic Colors

| 이름        | Light HEX | Dark HEX  | CSS 변수 (`:root`) | Tailwind 클래스 | 용도                      |
| ----------- | --------- | --------- | ------------------ | --------------- | ------------------------- |
| **SUCCESS** | `#10b981` | `#34d399` | `--success`        | `bg-success`    | 성공 메시지, 온라인 상태  |
| **WARNING** | `#f59e0b` | `#fbbf24` | `--warning`        | `bg-warning`    | 경고, 주의사항            |
| **ERROR**   | `#ef4444` | `#f87171` | `--error`          | `bg-error`      | 에러, 오프라인 상태, 삭제 |
| **INFO**    | `#3b82f6` | `#60a5fa` | `--info`           | `bg-info`       | 정보 메시지, 툴팁         |

---

## 3. Light & Dark Mode

| UI 요소            | Light Mode           | Dark Mode                         |
| ------------------ | -------------------- | --------------------------------- |
| **Background**     | `#ffffff`            | `oklch(0.145 0 0)`                |
| **Surface (Card)** | `#ffffff`            | `oklch(0.145 0 0)`                |
| **Surface Raised** | —                    | `oklch(0.205 0 0)` (sidebar 기준) |
| **Text Primary**   | `oklch(0.145 0 0)`   | `oklch(0.985 0 0)`                |
| **Text Secondary** | `#717182`            | `oklch(0.708 0 0)`                |
| **Border/Divider** | `rgba(0, 0, 0, 0.1)` | `oklch(0.269 0 0)`                |
| **Muted**          | `#ececf0`            | `oklch(0.269 0 0)`                |

---

## 4. `cn` 유틸리티 사용 규칙

가독성을 최우선으로 하며, 인간이 읽기 편한 구조를 지향합니다.

1.  **단순 단일 라인**: 클래스 명이 짧고(약 40자 미만) 조건부가 없다면 `className="..."` 문자열을 직접 사용합니다.
2.  **가독성을 위한 그룹화 (필수)**: 클래스 명이 길거나(약 40자 이상) 복잡할 경우, 반드시 `cn()`을 사용하고 **논리적 단위(Layout, Sizing, Interactive 등)로 묶어 줄바꿈**을 적용합니다. (주석은 달지 않습니다.)

```tsx
// GOOD: 인간이 읽기 편한 그룹화 (40자 이상일 때 권장)
<div
  className={cn(
    "flex items-center gap-2",
    "h-10 w-full max-w-50",
    "bg-brand transition-all duration-200",
  )}
/>
```

---

## 5. Responsive Design (Mobile-First)

1.  **기본 원칙**: 모든 컴포넌트는 모바일 뷰(375px 내외)를 기본값으로 스타일링합니다.
2.  **점진적 확장**: Tailwind의 브레이크포인트 접두사(`sm:`, `md:`, `lg:`, `xl:`)는 스타일을 추가하거나 덮어쓰는 용도로만 사용합니다.
3.  **구현 패턴**:
    - 레이아웃: `flex-col` (모바일) → `sm:flex-row` (태블릿 이상)
    - 너비: `w-full` (모바일) → `sm:max-w-100` 또는 `sm:w-auto`
    - 여백/패딩: `p-4` (모바일) → `sm:p-6`

---

## 6. Spacing & Sizing

1.  **임의 값([ ]) 지양**: Tailwind의 임의 값 표현식(예: `min-h-[100px]`, `w-[45px]`) 사용을 지양합니다.
2.  **표준 단위 사용**: Tailwind의 기본 스페이싱 단위(4px = 1 unit)를 사용하여 수치를 계산합니다. (`100px` → `min-h-25`)

---

## 7. 작업 원칙

1.  **추상화 우선**: 하드코딩된 HEX/RGB 대신 `bg-brand`, `text-live`, `border-error` 같은 테마 토큰 사용
2.  **다크모드 필수**: 모든 컴포넌트는 다크모드를 반드시 고려하여 설계
3.  **일관성 유지**: `src/components/ui`의 기존 스타일 패턴 계승
4.  **LIVE 단일 개념**: `--stream`(퍼플) 변수는 제거됨. 라이브 관련 UI는 모두 `--live` 사용

## 8. shadcn 컴포넌트 계층 규칙

1.  **공식 컴포지션 확인**: shadcn/Base UI 컴포넌트를 새로 조합할 때는 Context7 문서와 `src/components/ui`의 기존 래퍼 구현을 함께 확인한다.
2.  **그룹 기반 컴포넌트**: `DropdownMenuLabel`, `DropdownMenuItem`, `DropdownMenuRadioGroup` 등은 `DropdownMenuContent` 바로 아래에 두지 않고 `DropdownMenuGroup` 내부에 배치한다.
3.  **런타임 확인 필수**: Dropdown, Dialog, Popover처럼 클릭 후 렌더링되는 컴포넌트는 빌드 통과만으로 완료하지 않고 실제 트리거 클릭까지 확인한다.

## 9. Dialog 디자인 규칙

1.  **구성 필수값**: Dialog 프리뷰와 구현은 트리거, 제목, 설명, 핵심 요약 정보, 취소 버튼, 주요 액션 버튼이 한눈에 보여야 한다.
2.  **채팅 도메인**: 채팅방 만들기, 권한 위임, 검색 결과 같은 일반 채팅 액션은 `--brand` 민트 톤 또는 기본 버튼 톤을 사용한다.
3.  **라이브 도메인**: 방송 시작, 라이브 시청 CTA, 후원 액션은 `--live` 코랄 톤을 사용한다.
4.  **위험 액션**: 채팅방 나가기, 강퇴, 스트림키 재발급, 계정 연결 해제처럼 되돌리기 어렵거나 파괴적인 액션은 danger 톤을 사용한다.
5.  **외부 서비스 참고**: 치지직, SOOP처럼 외부 서비스의 흐름을 참고해야 하는 Dialog는 구현 전에 실제 화면 조사 결과를 문서화하고, Dialog가 아니라 Popover, Dropdown, 페이지 이동, 새 창인 경우 그 구조를 우선 따른다.
6.  **도메인 분리**: 채팅 Dialog와 라이브 Dialog는 같은 컴포넌트 질감을 공유하되 active 색상과 CTA 색상은 현재 도메인 기준으로 분리한다.

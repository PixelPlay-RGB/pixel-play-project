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

> **컬러 선택 근거**: `--brand` 민트(쿨톤)와 `--live` 코랄(웜톤)은 색상환 반대편에 위치해
> 자연스러운 대비를 형성합니다. `--live`는 경고/에러 의미가 아닌 **에너지 있는 세컨더리 액센트**로 사용합니다.
>
> **LIVE 통합 원칙**: 라이브 스트리밍은 `--live` 단일 컬러로 표현합니다. `--stream`(퍼플)은 사용하지 않습니다.

---

## 2. Semantic Colors

| 이름        | Light HEX | Dark HEX  | CSS 변수 (`:root`) | Tailwind 클래스 | 용도                      |
| ----------- | --------- | --------- | ------------------ | --------------- | ------------------------- |
| **SUCCESS** | `#10b981` | `#34d399` | `--success`        | `bg-success`    | 성공 메시지, 온라인 상태  |
| **WARNING** | `#f59e0b` | `#fbbf24` | `--warning`        | `bg-warning`    | 경고, 주의사항            |
| **ERROR**   | `#ef4444` | `#f87171` | `--error`          | `bg-error`      | 에러, 오프라인 상태, 삭제 |
| **INFO**    | `#3b82f6` | `#60a5fa` | `--info`           | `bg-info`       | 정보 메시지, 툴팁         |

> Semantic 컬러는 상태 표시 전용입니다. UI 브랜딩에는 `--brand` / `--live`를 사용하세요.

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

> **다크모드 우선**: 라이브 스트리밍 시청 시 눈의 피로를 줄이기 위해 다크모드를 기본으로 권장.

---

## 4. theme.css 적용 구조

CSS 변수는 두 단계로 관리합니다.

```css
/* ─── 1단계: :root / .dark 에 원시 변수 정의 ─────────────────────── */
:root {
  --brand: #46c6a9;
  --brand-foreground: #ffffff;
  --live: #ff6057;
  --live-foreground: #ffffff;
  --success: #10b981;
  --success-foreground: #ffffff;
  --warning: #f59e0b;
  --warning-foreground: #ffffff;
  --error: #ef4444;
  --error-foreground: #ffffff;
  --info: #3b82f6;
  --info-foreground: #ffffff;
}

.dark {
  --brand: #46c6a9; /* 브랜드 컬러는 라이트/다크 동일 */
  --brand-foreground: #000000;
  --live: #ff7b73; /* 다크모드 완화 톤 */
  --live-foreground: #000000;
  --success: #34d399;
  --success-foreground: #000000;
  --warning: #fbbf24;
  --warning-foreground: #000000;
  --error: #f87171;
  --error-foreground: #000000;
  --info: #60a5fa;
  --info-foreground: #000000;
}

/* ─── 2단계: @theme inline 에서 Tailwind 유틸리티로 매핑 ──────────── */
@theme inline {
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-live: var(--live);
  --color-live-foreground: var(--live-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-error: var(--error);
  --color-error-foreground: var(--error-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
}
```

---

## 5. Tailwind 클래스 사용 예시

```tsx
// 브랜드 (Primary 액센트)
<Button className="bg-brand text-white hover:bg-brand/90" />

// 라이브 뱃지 (Secondary 액센트 — 에러가 아닌 에너지 강조)
<Badge className="bg-live text-white">LIVE</Badge>

// 라이브 액센트 활용
<div className="border-l-4 border-live bg-live/10" />

// 시맨틱 상태 표시
<span className="text-success">온라인</span>
<span className="text-error">오프라인</span>
<span className="text-warning">주의</span>
<span className="text-info">안내</span>

// 시맨틱 배경 활용
<div className="bg-success/10 text-success border border-success/20">성공</div>
<div className="bg-error/10 text-error border border-error/20">에러</div>
```

---

## 6. 컴포넌트별 컬러 적용 가이드

### 채팅방 카드

- 기본: `bg-card border-border/60`
- 호버: `hover:border-brand/40 hover:shadow-brand/5 dark:hover:bg-zinc-800/50`
- 안 읽음 pill: `bg-brand text-white shadow-brand/30` (테두리 강조 없음, pill만)

### 라이브 스트리밍 요소

- 라이브 뱃지: `bg-live text-white`
- 시청자 수: `text-brand font-mono`
- 라이브 중 강조 테두리: `border-live shadow-live/20`

### 버튼

- Primary: `bg-brand text-white hover:opacity-90`
- Secondary: `bg-secondary text-secondary-foreground`
- Destructive: `bg-destructive text-destructive-foreground` ← `--error`가 아닌 `--destructive` 사용
- Ghost: `hover:bg-accent hover:text-accent-foreground`

### 상태 표시

- Online: `bg-success/10 text-success border-success/20`
- Offline: `bg-error/10 text-error border-error/20`
- Busy: `bg-warning/10 text-warning border-warning/20`
- Info: `bg-info/10 text-info border-info/20`

---

## 7. 작업 원칙

1. **추상화 우선**: 하드코딩된 HEX/RGB 대신 `bg-brand`, `text-live`, `border-error` 같은 테마 토큰 사용
2. **다크모드 필수**: 모든 컴포넌트는 다크모드를 반드시 고려하여 설계
3. **일관성 유지**: `src/components/ui`의 기존 스타일 패턴 계승
4. **접근성**: 충분한 명도 대비(WCAG AA 이상) 확보
5. **영상 중심**: 스트리밍 콘텐츠가 돋보이도록 UI는 절제된 컬러 사용
6. **LIVE 단일 개념**: `--stream`(퍼플) 변수는 제거됨. 라이브 관련 UI는 모두 `--live` 사용
7. **Semantic ≠ Brand**: `--error`는 에러 메시지 전용, 라이브 뱃지에는 `--live` 사용

---

## 8. Responsive Design (Mobile-First)

1. **기본 원칙**: 모든 컴포넌트는 모바일 뷰(375px 내외)를 기본값으로 스타일링합니다.
2. **점진적 확장**: Tailwind의 브레이크포인트 접두사(`sm:`, `md:`, `lg:`, `xl:`)는 스타일을 추가하거나 덮어쓰는 용도로만 사용합니다.
3. **구현 패턴**:
   - 레이아웃: `flex-col` (모바일) → `sm:flex-row` (태블릿 이상)
   - 너비: `w-full` (모바일) → `sm:max-w-[400px]` 또는 `sm:w-auto`
   - 여백/패딩: `p-4` (모바일) → `sm:p-6`
4. **테스트**: 크롬 개발자 도구의 'Device Mode'를 활용하여 다양한 모바일 기기 해상도에서 UI가 깨지지 않는지 상시 확인합니다.

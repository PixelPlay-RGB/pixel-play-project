# PixelPlay — Visual Identity & Color System

> 상태: **확정** → globals.css @theme 블록 적용 완료

## 브랜드 컨셉

**"The Playground for Live Interaction"** (실시간 소통을 위한 놀이터)
역동적인 라이브 스트리밍과 실시간 채팅을 직관적이고 현대적인 인터페이스로 제공.
청정하고 안정적인 민트그린 브랜드 컬러와 고대비 다크모드 시스템.

---

## 1. Core Brand Colors

| 이름              | HEX       | 변수명           | 용도                                                 |
| ----------------- | --------- | ---------------- | ---------------------------------------------------- |
| **PIXEL_MINT**    | `#46c6a9` | `--color-brand`  | 주요 CTA 버튼, 활성 상태, 브랜드 로고, 탭 하이라이트 |
| **LIVE_RED**      | `#FF4458` | `--color-live`   | 라이브 뱃지, 실시간 알림, 온에어 상태 표시           |
| **STREAM_PURPLE** | `#8B5CF6` | `--color-stream` | 스트리밍 관련 액센트, 프리미엄 기능                  |

---

## 2. Semantic Colors

| 이름        | HEX       | 변수명            | 용도                      |
| ----------- | --------- | ----------------- | ------------------------- |
| **SUCCESS** | `#10B981` | `--color-success` | 성공 메시지, 온라인 상태  |
| **WARNING** | `#F59E0B` | `--color-warning` | 경고, 주의사항            |
| **ERROR**   | `#EF4444` | `--color-error`   | 에러, 오프라인 상태, 삭제 |
| **INFO**    | `#3B82F6` | `--color-info`    | 정보 메시지, 툴팁         |

---

## 3. Light & Dark Mode

| UI 요소              | Light Mode (OKLCH) | Dark Mode (OKLCH)        |
| -------------------- | ------------------ | ------------------------ |
| **Background**       | `oklch(0.97 0 0)`  | `oklch(0.145 0 0)`       |
| **Surface (Card)**   | `oklch(1 0 0)`     | `oklch(0.205 0 0)`       |
| **Surface Elevated** | `oklch(1 0 0)`     | `oklch(0.232 0 0)`       |
| **Text Primary**     | `oklch(0.145 0 0)` | `oklch(0.985 0 0)`       |
| **Text Secondary**   | `oklch(0.556 0 0)` | `oklch(0.708 0 0)`       |
| **Border/Divider**   | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)`     |
| **Overlay**          | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.05)` |

> **다크모드 우선**: 라이브 스트리밍 시청 시 눈의 피로를 줄이기 위해 다크모드를 기본으로 권장

---

## 4. globals.css 적용 가이드

### 현재 적용된 CSS 변수

```css
@theme inline {
  /* Brand Colors */
  --color-brand: #46c6a9;
  --color-live: #ff4458;
  --color-stream: #8b5cf6;

  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Base Colors */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-border: var(--border);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
}
```

## Tailwind 클래스 사용 예시

```typescript
// 브랜드 컬러
<Button className="bg-brand text-white hover:bg-brand/90">

// 라이브 뱃지
<Badge className="bg-live text-white">LIVE</Badge>

// 스트리밍 액센트

<div className="border-l-4 border-stream bg-stream/10">

// 상태 표시
<span className="text-success">온라인</span>
<span className="text-error">오프라인</span>
```

## 5. 컴포넌트별 컬러 적용 가이드

### 채팅방 카드

- 기본: bg-card border-border
- 호버: hover:border-brand/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50
- Active: border-brand ring-brand/20 ring-3

### 라이브 스트리밍 요소

- 라이브 뱃지: bg-live text-white shadow-live/20 shadow-lg
- 시청자 수: text-brand font-mono
- 스트리머 프레임: border-stream shadow-stream/20

### 버튼

- Primary: bg-brand text-white hover:opacity-90
- Secondary: bg-secondary text-secondary-foreground
- Destructive: bg-error text-white
- Ghost: hover:bg-accent hover:text-accent-foreground

### 상태 표시

- Online: bg-success/10 text-success border-success/20
- Offline: bg-error/10 text-error border-error/20
- Busy: bg-warning/10 text-warning border-warning/20

## 6. 작업 원칙

1. 추상화 우선: 하드코딩된 HEX/RGB 대신 bg-brand, text-live, border-stream 같은 테마 토큰 사용
2. 다크모드 필수: 모든 컴포넌트는 다크모드를 고려하여 설계
3. 일관성 유지: src/components/ui의 기존 스타일 패턴 계승
4. 접근성: 충분한 명도 대비(WCAG AA 이상) 확보
5. 영상 중심: 스트리밍 콘텐츠가 돋보이도록 UI는 절제된 컬러 사용

## 7. Responsive Design (Mobile-First)

1. **기본 원칙**: 모든 컴포넌트는 모바일 뷰(375px 내외)를 기본값으로 스타일링합니다.
2. **점진적 확장**: Tailwind의 브레이크포인트 접두사(`sm:`, `md:`, `lg:`, `xl:`)는 스타일을 추가하거나 덮어쓰는 용도로만 사용합니다.
3. **구현 패턴**:
   - 레이아웃: `flex-col` (모바일) → `sm:flex-row` (태블릿 이상)
   - 너비: `w-full` (모바일) → `sm:max-w-[400px]` 또는 `sm:w-auto`
   - 여백/패딩: `p-4` (모바일) → `sm:p-6`
4. **테스트**: 크롬 개발자 도구의 'Device Mode'를 활용하여 다양한 모바일 기기 해상도에서 UI가 깨지지 않는지 상시 확인합니다.

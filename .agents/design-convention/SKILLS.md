# PixelPlay — Visual Identity & Color System

> 상태: **기초 설정** (현재 figma-make 연동 및 디자인 시스템 재구축 준비 중)

## 브랜드 컨셉

**"The Playground for Live Interaction"** (실시간 소통을 위한 놀이터)
역동적인 라이브 스트리밍과 실시간 채팅을 직관적이고 현대적인 인터페이스로 제공.
청정하고 안정적인 `BRAND_PRIMARY` 컬러와 고대비 다크모드 시스템 지향.

---

## 1. Core Brand Color

| 이름 | HEX | 변수명 | 용도 |
|------|-----|--------|------|
| **BRAND_PRIMARY** | `#46c6a9` | `--color-brand` | 주요 CTA 버튼, 활성 상태 아이콘, 브랜드 로고 포인트 |

> **주의**: 현재 `globals.css`에서 `brand` 변수명으로 사용 중인 `#46c6a9` 컬러는 유지하며, 추후 figma-make 작업 시 확정된 컬러로 업데이트 예정입니다.

---

## 2. Light & Dark Mode (Current System)

현재 프로젝트는 Tailwind CSS v4와 OKLCH 기반의 shadcn 시스템을 사용합니다.

| UI 요소 | Light Mode (OKLCH) | Dark Mode (OKLCH) |
|---------|-----------|-----------|
| Background | `oklch(0.97 0 0)` | `oklch(0.145 0 0)` |
| Surface (Card) | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| Text (Primary) | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| Border/Divider | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |

---

## 3. globals.css 적용 가이드

Tailwind CSS v4 `@theme` 블록 내의 정의를 따르며, 컴포넌트 개발 시 아래 토큰을 우선적으로 활용합니다.

```css
@theme inline {
  --color-brand: #46c6a9;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-border: var(--border);
}
```

### 작업 원칙
- **추상화 우선**: 하드코딩된 HEX/RGB 대신 `bg-brand`, `text-foreground`와 같은 테마 토큰을 사용하십시오.
- **다크모드 대응**: `@custom-variant dark` 설정을 통해 자동으로 전환되는 시스템 변수를 활용하십시오.
- **일관성**: 새 컴포넌트 추가 시 `src/components/ui`에 정의된 기본 스타일을 계승합니다.

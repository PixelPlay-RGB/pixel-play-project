/** shadcn 토큰을 활용한 emoji-picker-react 스타일 커스텀 */
export const eprThemedStyle = {
  // 기본 캔버스
  "--epr-bg-color": "var(--popover)",
  "--epr-picker-border-color": "var(--border)",
  "--epr-picker-border-radius": "var(--radius-lg)",
  // 텍스트
  "--epr-text-color": "var(--muted-foreground)",
  // 검색
  "--epr-search-input-bg-color": "var(--muted)",
  "--epr-search-input-text-color": "var(--foreground)",
  "--epr-search-input-placeholder-color": "var(--muted-foreground)",
  "--epr-search-input-bg-color-active": "var(--background)",
  "--epr-search-border-color": "var(--border)",
  // 카테고리 / 라벨
  "--epr-category-label-bg-color":
    "color-mix(in oklch, var(--background) 92%, transparent)",
  "--epr-category-icon-active-color": "var(--primary)",
  // 호버 / 포커스
  "--epr-hover-bg-color": "var(--accent)",
  "--epr-focus-bg-color": "var(--accent)",
  "--epr-hover-bg-color-reduced-opacity":
    "color-mix(in oklch, var(--accent) 50%, transparent)",
  "--epr-highlight-color": "var(--primary)",
  // 이모지 그리드
  "--epr-emoji-hover-color": "var(--accent)",
  "--epr-emoji-variation-picker-bg-color": "var(--popover)",
  "--epr-emoji-variation-indicator-color": "var(--border)",
  // 미리보기
  "--epr-preview-border-color": "var(--border)",
  "--epr-preview-text-color": "var(--foreground)",
  // 스킨톤
  "--epr-skin-tone-picker-menu-color": "var(--popover)",
  "--epr-skin-tone-outer-border-color": "var(--border)",
  "--epr-skin-tone-inner-border-color": "var(--popover)",
  // dark 테마 토대(라이브러리 DARK 경로) — html.dark에서도 토큰이 같이 바뀜
  "--epr-dark-bg-color": "var(--popover)",
  "--epr-dark-picker-border-color": "var(--border)",
  "--epr-dark-text-color": "var(--muted-foreground)",
  "--epr-dark-search-input-bg-color": "var(--muted)",
  "--epr-dark-category-label-bg-color":
    "color-mix(in oklch, var(--background) 88%, transparent)",
  "--epr-dark-hover-bg-color": "var(--accent)",
  "--epr-dark-focus-bg-color": "var(--accent)",
  "--epr-dark-highlight-color": "var(--primary)",
  "--epr-dark-emoji-variation-picker-bg-color": "var(--popover)",
  "--epr-dark-category-icon-active-color": "var(--primary)",
} as const satisfies Record<string, string>;

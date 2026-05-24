// 랜딩 프리뷰 레이아웃 계산에 필요한 브라우저 치수를 제공합니다.
export function getAppHeaderHeight() {
  if (typeof window === "undefined") return 0;

  const headerHeight = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--app-header-height");

  return Number.parseFloat(headerHeight) || 0;
}

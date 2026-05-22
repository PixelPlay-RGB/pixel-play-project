// 주요 앱 라우터 판별 유틸리티를 제공합니다.

export const DEFAULT_MAIN_ROUTE = "/live";
export const MAIN_ROUTE_STORAGE_KEY = "pixelplay:last-main-route";

export type MainRoute = "/live" | "/chat";

export function resolveMainRoute(pathname: string): MainRoute | null {
  if (pathname.startsWith("/chat")) return "/chat";
  if (pathname === "/" || pathname.startsWith("/live")) return "/live";

  return null;
}

export function isMainRoute(value: string | null): value is MainRoute {
  return value === "/live" || value === "/chat";
}

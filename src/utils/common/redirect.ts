// 내부 redirect 경로 검증과 query 생성을 관리합니다.
const DEFAULT_REDIRECT_PATH = "/live";

export function sanitizeRedirectPath(value: string | null | undefined): string {
  if (!value) {
    return DEFAULT_REDIRECT_PATH;
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.toLowerCase().includes("%5c")
  ) {
    return DEFAULT_REDIRECT_PATH;
  }

  try {
    const url = new URL(value, "https://pixel-play.studio");
    return `${url.pathname}${url.search}${url.hash}` || DEFAULT_REDIRECT_PATH;
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }
}

export function createPathWithNext(pathname: string, next: string): string {
  const params = new URLSearchParams({ next: sanitizeRedirectPath(next) });
  return `${pathname}?${params.toString()}`;
}

export function appendSearchParam(path: string, param: string): string {
  const safePath = sanitizeRedirectPath(path);
  const [pathnameWithSearch, hash = ""] = safePath.split("#", 2);
  const [pathname, search = ""] = pathnameWithSearch.split("?", 2);
  const params = new URLSearchParams(search);
  const nextParams = new URLSearchParams(param.startsWith("?") ? param.slice(1) : param);

  nextParams.forEach((value, key) => {
    params.set(key, value);
  });

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

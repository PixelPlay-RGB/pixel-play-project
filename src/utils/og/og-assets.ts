// 동적 OG 이미지(next/og)에서 공유하는 사이즈·색·자산 로더입니다.
// satori 제약: CSS 변수·tailwind 불가(→ globals.css 라이트 토큰 hex를 박는다),
// woff2·webp 미지원(→ 폰트는 구형 UA로 woff 유도, 이미지는 png/jpeg만 통과).
import "server-only";

export const OG_SIZE = { width: 1200, height: 630 } as const;

export const OG_COLOR = {
  brand: "#46c6a9",
  live: "#ff6057",
  bg: "#0b0f0e",
  bgSoft: "#11201c",
  text: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.72)",
} as const;

const SITE_ORIGIN = "https://pixel-play.studio";

// 상대 경로(Storage public·정적 자산)를 OG 크롤러가 fetch할 절대 URL로 만든다.
export function toAbsoluteOgUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Google Fonts에서 주어진 텍스트의 글리프만 담은 폰트를 받아 satori용 ArrayBuffer로 반환한다.
// 한글 전체 폰트는 수 MB라 동적 텍스트 서브셋(text= 파라미터)만 받는다. satori는 woff2를 못 읽으므로
// 구형 User-Agent로 woff/ttf 응답을 유도한다. 어떤 단계든 실패하면 null → 호출부는 기본 폰트로 폴백(한글은 □).
export async function loadKoreanOgFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl =
      "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&display=swap&text=" +
      encodeURIComponent(text);
    const cssResponse = await fetch(cssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36",
      },
    });

    if (!cssResponse.ok) return null;

    const css = await cssResponse.text();
    const fontUrl = css.match(/src:\s*url\((https:\/\/[^)]+?)\)/)?.[1];

    if (!fontUrl) return null;

    const fontResponse = await fetch(fontUrl);

    if (!fontResponse.ok) return null;

    return await fontResponse.arrayBuffer();
  } catch (error) {
    console.error("OG 한글 폰트 로드 실패", error);
    return null;
  }
}

// satori는 PNG/JPEG만 안정 지원(webp·avif 불가)이라, 받아서 content-type을 확인한 뒤
// 안전한 포맷만 data URL로 통과시킨다. 그 외(webp·fetch 실패)는 null → 호출부에서 그라데이션 배경 폴백.
export async function loadOgImageDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);

    if (!response.ok) return null;

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();

    if (!/^image\/(png|jpe?g)/.test(contentType)) return null;

    const buffer = await response.arrayBuffer();

    return `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch (error) {
    console.error("OG 이미지 로드 실패", error);
    return null;
  }
}

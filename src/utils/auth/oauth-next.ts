// OAuth 로그인 시작 시 돌아올 경로(next)를 콜백까지 전달하기 위한 단기 쿠키 헬퍼입니다.
import { OAUTH_NEXT_COOKIE } from "@/constants/auth/auth";

const OAUTH_NEXT_MAX_AGE_SECONDS = 600;

// redirectTo에 쿼리(next)를 붙이지 않고 쿠키로 전달해, Supabase Redirect URL을 정확 일치로 유지합니다.
export function setOAuthNextCookie(next: string) {
  const attributes = [
    `${OAUTH_NEXT_COOKIE}=${encodeURIComponent(next)}`,
    "Path=/",
    `Max-Age=${OAUTH_NEXT_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ];

  if (window.location.protocol === "https:") {
    attributes.push("Secure");
  }

  document.cookie = attributes.join("; ");
}

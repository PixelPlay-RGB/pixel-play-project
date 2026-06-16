// 결제 성공/실패 리다이렉트의 복귀 경로를 안전한 내부 상대경로로 정규화합니다.
// 라이브 화면 등 충전 시작 지점으로 되돌리되, 오픈 리다이렉트(외부 URL·프로토콜 상대 경로)는 차단합니다.

export const DEFAULT_PAYMENT_RETURN_PATH = "/user/donations";

// 단일 "/"로 시작하는 내부 경로만 허용한다. "//evil"·"/\evil"·"http://..."는 차단.
const SAFE_INTERNAL_PATH_PATTERN = /^\/[A-Za-z0-9/_-]*$/;

export function resolvePaymentReturnPath(value: string | string[] | undefined): string {
  if (typeof value !== "string") {
    return DEFAULT_PAYMENT_RETURN_PATH;
  }

  if (!SAFE_INTERNAL_PATH_PATTERN.test(value) || value.startsWith("//")) {
    return DEFAULT_PAYMENT_RETURN_PATH;
  }

  return value;
}

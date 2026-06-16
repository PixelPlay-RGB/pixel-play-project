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

// 정규화한 복귀 경로에 paymentStatus 쿼리를 안전하게 병합한다.
// resolvePaymentReturnPath는 현재 쿼리(?)를 허용하지 않지만, 계약이 바뀌어
// 경로에 쿼리가 섞여도 깨지지 않도록 URL로 병합한다(문자열 결합 회피).
export function buildPaymentReturnRedirect(
  value: string | string[] | undefined,
  paymentStatus: string,
): string {
  const returnPath = resolvePaymentReturnPath(value);
  const nextUrl = new URL(returnPath, "http://localhost");
  nextUrl.searchParams.set("paymentStatus", paymentStatus);

  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
}

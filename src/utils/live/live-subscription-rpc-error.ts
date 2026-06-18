// 라이브 구독 RPC 오류 코드를 앱 메시지 코드로 변환합니다.
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";

interface SupabaseLikeError {
  code?: string;
}

const LIVE_SUBSCRIPTION_RPC_ERROR_CODE_MAP: Array<{
  errorCode: string;
  code: AppMessageCode;
}> = [
  {
    errorCode: "PX401",
    code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
  },
  {
    errorCode: "PX402",
    code: APP_MESSAGE_CODE.error.live.subscriptionInsufficientBalance,
  },
];

export function resolveLiveSubscriptionRpcErrorCode(
  error: unknown,
  fallbackCode: AppMessageCode = APP_MESSAGE_CODE.error.live.subscriptionFailed,
): AppMessageCode {
  const code = readSupabaseErrorCode(error);

  return (
    LIVE_SUBSCRIPTION_RPC_ERROR_CODE_MAP.find((item) => item.errorCode === code)?.code ??
    fallbackCode
  );
}

export function isKnownLiveSubscriptionRpcError(error: unknown) {
  const code = readSupabaseErrorCode(error);

  return LIVE_SUBSCRIPTION_RPC_ERROR_CODE_MAP.some((item) => item.errorCode === code);
}

function readSupabaseErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  return (error as SupabaseLikeError).code;
}

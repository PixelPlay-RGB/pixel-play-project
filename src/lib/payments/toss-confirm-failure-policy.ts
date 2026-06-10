// Toss 승인 응답의 실패 확정 여부를 분류합니다.
const RETRYABLE_TOSS_CONFIRM_STATUS_CODES = new Set([409, 429]);
const NON_FAILURE_TOSS_CONFIRM_ERROR_CODES = new Set([
  "ALREADY_PROCESSED_PAYMENT",
  "FORBIDDEN_CONSECUTIVE_REQUEST",
  "IDEMPOTENT_REQUEST_PROCESSING",
  "PROVIDER_ERROR",
]);

export const TOSS_CONFIRM_TIMEOUT_MS = 5000;

interface TossConfirmFailurePolicyInput {
  status: number;
  errorCode: string | null;
}

export function shouldMarkTossConfirmFailed(input: TossConfirmFailurePolicyInput) {
  const errorCode = input.errorCode?.trim() ?? "";

  if (NON_FAILURE_TOSS_CONFIRM_ERROR_CODES.has(errorCode)) {
    return false;
  }

  if (input.status >= 500) {
    return false;
  }

  if (RETRYABLE_TOSS_CONFIRM_STATUS_CODES.has(input.status)) {
    return false;
  }

  return true;
}

// 결제 결과 쿼리 파라미터(paymentStatus)를 앱 메시지 코드로 매핑합니다.
// 후원 지갑 화면과 라이브 시청 화면이 같은 결제 결과 토스트를 공유하기 위해 분리했습니다.

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";

const PAYMENT_STATUS_MESSAGE_CODE: Record<string, AppMessageCode> = {
  charge_success: APP_MESSAGE_CODE.success.donation.chargeConfirmed,
  charge_failed: APP_MESSAGE_CODE.error.donation.chargeFailed,
  charge_canceled: APP_MESSAGE_CODE.error.donation.chargeCanceled,
};

export function getPaymentResultCode(
  value: string | string[] | undefined,
): AppMessageCode | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return PAYMENT_STATUS_MESSAGE_CODE[value];
}

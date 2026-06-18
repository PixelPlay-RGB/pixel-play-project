// 후원 지갑 충전 금액 검증을 클라/서버 공용 순수 함수로 제공합니다.
// (지갑 충전 카드·prepare route·confirm 서버 util이 동일 규칙을 공유)

import {
  WALLET_CHARGE_MAX_AMOUNT,
  WALLET_CHARGE_MIN_AMOUNT,
  WALLET_CHARGE_STEP_AMOUNT,
} from "@/constants/payments/wallet-charge";

// 정수이며 [MIN, MAX] 범위 안의 STEP 배수일 때만 유효한 충전 금액으로 본다.
// Number.isInteger가 number 외 값을 false로 거르므로 number | undefined 입력도 그대로 안전하다.
export function isValidChargeAmount(value: number | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= WALLET_CHARGE_MIN_AMOUNT &&
    value <= WALLET_CHARGE_MAX_AMOUNT &&
    value % WALLET_CHARGE_STEP_AMOUNT === 0
  );
}

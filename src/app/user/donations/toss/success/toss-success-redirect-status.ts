// Toss 성공 리다이렉트의 결제 결과 상태를 결정합니다.
type TossConfirmResult = {
  success: boolean;
};

export type TossSuccessRedirectPaymentStatus = "charge_success" | "charge_failed";

export async function getTossSuccessRedirectPaymentStatus(
  confirmCharge: () => Promise<TossConfirmResult>,
): Promise<TossSuccessRedirectPaymentStatus> {
  try {
    const result = await confirmCharge();

    return result.success ? "charge_success" : "charge_failed";
  } catch (error) {
    console.error("Toss 결제 승인 리다이렉트 처리 실패", error);

    return "charge_failed";
  }
}

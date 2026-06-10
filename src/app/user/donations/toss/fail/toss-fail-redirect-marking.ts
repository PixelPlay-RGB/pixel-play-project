// Toss 실패 리다이렉트에서 상태 마킹 실패가 최종 이동을 막지 않도록 처리합니다.
interface TossFailRedirectMarkingInput {
  orderId: string;
  markFailure: () => Promise<void>;
}

export async function markTossFailureForRedirect({
  orderId,
  markFailure,
}: TossFailRedirectMarkingInput) {
  try {
    await markFailure();
  } catch (error) {
    console.error("Toss 결제 실패 상태 마킹 실패", {
      orderId,
      error,
    });
  }
}

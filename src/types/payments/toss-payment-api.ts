// Toss Payments API 응답 타입을 정의합니다.

export interface TossPaymentPrepareResponse {
  orderId: string;
  orderName: string;
  amount: number;
}

export interface TossPaymentConfirmResponse {
  orderId: string;
  amount: number;
  paymentKey: string;
  balanceAfter: number | null;
  replayed: boolean;
}

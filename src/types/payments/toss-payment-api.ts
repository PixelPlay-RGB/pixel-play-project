// Toss Payments API 응답 타입을 정의합니다.

export interface TossPaymentPrepareResponse {
  orderId: string;
  orderName: string;
  amount: number;
}

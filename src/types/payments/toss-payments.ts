// Toss Payments JS SDK v2 전역 타입을 정의합니다.

export interface TossPaymentsFactory {
  (clientKey: string): TossPaymentsClient;
}

export interface TossPaymentsClient {
  payment(params: TossPaymentsPaymentParams): TossPaymentsPayment;
}

export interface TossPaymentsPaymentParams {
  customerKey: string;
}

export interface TossPaymentsPayment {
  requestPayment(paymentRequest: TossPaymentsDirectPaymentRequest): Promise<void>;
  destroy(): Promise<void> | void;
}

export interface TossPaymentsAmount {
  currency: "KRW";
  value: number;
}

export interface TossPaymentsDirectPaymentRequest {
  method: "CARD";
  amount: TossPaymentsAmount;
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, string>;
}

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

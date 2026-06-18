// Toss Payments JS SDK v2 전역 타입을 정의합니다.

export interface TossPaymentsFactory {
  (clientKey: string): TossPaymentsClient;
}

export interface TossPaymentsClient {
  payment(params: TossPaymentsPaymentParams): TossPaymentsPayment;
  widgets(params: TossPaymentsPaymentParams): TossPaymentsWidgets;
}

export interface TossPaymentsPaymentParams {
  customerKey: string;
}

export interface TossPaymentsPayment {
  requestPayment(paymentRequest: TossPaymentsDirectPaymentRequest): Promise<void>;
  destroy(): Promise<void> | void;
}

// Promise 방식(PC) 결제 성공 시 돌아오는 결과(승인 확정에 필요한 키). amount는 우리가 prepare한 값을 그대로 쓴다.
export interface TossPaymentsPaymentResult {
  paymentKey: string;
  orderId: string;
}

export interface TossPaymentsWidgets {
  setAmount(amount: TossPaymentsAmount): Promise<void>;
  renderPaymentWindow(): Promise<TossPaymentsPaymentWindow>;
  // successUrl/failUrl을 생략하면 Promise 방식으로 결과를 받는다(PC 한정). 지정하면 Redirect 방식.
  requestPayment(
    paymentRequest: TossPaymentsWidgetPaymentRequest,
  ): Promise<TossPaymentsPaymentResult>;
}

export interface TossPaymentsPaymentWindow {
  on(event: "paymentRequest", callback: () => Promise<void> | void): void;
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

export interface TossPaymentsWidgetPaymentRequest {
  orderId: string;
  orderName: string;
  // Redirect 방식에서만 필요. Promise 방식(PC)에선 생략한다.
  successUrl?: string;
  failUrl?: string;
  // PC 기본 "iframe"(리다이렉트 없이 결제창), 모바일은 "self"로 강제 리다이렉트해야 한다.
  windowTarget?: "self" | "iframe";
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, string>;
}

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

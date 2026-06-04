// Toss Payments JS SDK v2 전역 타입을 정의합니다.

export interface TossPaymentsFactory {
  (clientKey: string): TossPaymentsClient;
}

export interface TossPaymentsClient {
  widgets(params: TossPaymentsWidgetsParams): TossPaymentsWidgets;
}

export interface TossPaymentsWidgetsParams {
  customerKey: string;
}

export interface TossPaymentsWidgets {
  setAmount(amount: TossPaymentsAmount): Promise<void>;
  renderPaymentWindow(params?: TossPaymentsPaymentWindowParams): Promise<TossPaymentsPaymentWindow>;
  requestPayment(paymentRequest: TossPaymentsPaymentRequest): Promise<void>;
}

export interface TossPaymentsAmount {
  currency: "KRW";
  value: number;
}

export interface TossPaymentsPaymentWindowParams {
  variantKey?: {
    paymentMethod?: string;
    agreement?: string;
  };
}

export interface TossPaymentsPaymentWindow {
  on(eventName: "paymentRequest", callback: TossPaymentsPaymentRequestCallback): void;
  destroy(): Promise<void> | void;
}

export interface TossPaymentsPaymentMethod {
  code: string;
  methodId?: string;
}

export type TossPaymentsPaymentRequestCallback = (paymentMethod: TossPaymentsPaymentMethod) => void;

export interface TossPaymentsPaymentRequest {
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  metadata?: Record<string, string>;
}

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

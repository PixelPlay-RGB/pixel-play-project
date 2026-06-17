// TossPayments v2 표준 SDK(CDN)를 한 번만 로드하고 전역 팩토리를 돌려줍니다.
// 여러 화면(지갑 충전 카드·라이브 후원 충전)이 SDK 로딩을 중복하지 않도록 공유합니다.

import type { TossPaymentsFactory } from "@/types/payments/toss-payments";

export const TOSS_PAYMENTS_SDK_URL = "https://js.tosspayments.com/v2/standard";

let sdkPromise: Promise<TossPaymentsFactory> | null = null;

export function loadTossPayments(): Promise<TossPaymentsFactory> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("TossPayments SDK는 브라우저에서만 로드할 수 있습니다."));
  }

  if (window.TossPayments) {
    return Promise.resolve(window.TossPayments);
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise<TossPaymentsFactory>((resolve, reject) => {
    const onLoaded = () => {
      if (window.TossPayments) {
        resolve(window.TossPayments);
      } else {
        sdkPromise = null;
        reject(new Error("TossPayments SDK 로드 후 전역 객체를 찾지 못했습니다."));
      }
    };
    const onError = () => {
      sdkPromise = null;
      reject(new Error("TossPayments SDK 로드에 실패했습니다."));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TOSS_PAYMENTS_SDK_URL}"]`,
    );

    if (existing) {
      existing.addEventListener("load", onLoaded, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TOSS_PAYMENTS_SDK_URL;
    script.async = true;
    script.addEventListener("load", onLoaded, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  });

  return sdkPromise;
}

"use client";
// 라이브 후원 모달에서 후원금을 충전하기 위한 TossPayments 결제 훅입니다.
// PC는 Promise 방식(리다이렉트 없이 결제창 → 직접 승인 확정)으로 모달을 유지하고,
// 모바일은 토스 제약상 Promise를 못 받으므로 successUrl/failUrl 리다이렉트로 폴백합니다.
//
// ⚠️ 토스 결제창(renderPaymentWindow)은 `paymentRequest`/`destroy`만 노출하고 "닫힘/취소" 이벤트가
// 없다. 따라서 결제창을 await로 기다리면 사용자가 결제수단을 고르지 않고 X로 닫을 때 영원히 멈춘다
// (= 모달 프리즈). 지갑 충전 카드와 동일하게 fire-and-forget으로 짠다: requestCharge는 결제창만 열고
// 즉시 반환하며, isCharging은 실제 requestPayment가 진행되는 구간(결제수단 선택 후)에만 true가 된다.

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useIsMobile } from "@/hooks/common/use-mobile";
import type {
  TossPaymentsPaymentWindow,
  TossPaymentsWidgets,
} from "@/types/payments/toss-payments";
import { toastAppError, toastAppInfo, toastAppSuccess } from "@/utils/common/toast-message";
import { loadTossPayments } from "@/utils/payments/toss-sdk";
import {
  isTossPaymentCancelError,
  isValidChargeAmount,
  prepareTossWalletCharge,
} from "@/utils/payments/toss-wallet-charge-client";

interface UseTossWalletChargeParams {
  // 결제 customerKey(=로그인 유저 id). 없으면 충전 불가.
  customerKey?: string;
  // 모바일 리다이렉트 폴백 시 결제 후 돌아올 내부 경로.
  returnTo?: string;
  // 충전 승인 확정 후(잔액 재조회 완료) 호출. 후원 모달을 다시 띄워 갱신된 잔액을 보여주는 용도.
  onChargeSuccess?: () => void;
  // 결제 진행(requestPayment)이 성공/취소/실패로 끝났을 때 호출. 입력값 보존 플래그 해제 용도.
  onChargeSettled?: () => void;
}

type PreparedCharge = Awaited<ReturnType<typeof prepareTossWalletCharge>>;

export function useTossWalletCharge({
  customerKey,
  returnTo,
  onChargeSuccess,
  onChargeSettled,
}: UseTossWalletChargeParams) {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY;
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [isCharging, setIsCharging] = useState(false);
  const paymentWindowRef = useRef<TossPaymentsPaymentWindow | null>(null);

  // 언마운트 시 떠 있던 결제창을 정리한다(닫힘 이벤트가 없어 직접 destroy해야 한다).
  useEffect(
    () => () => {
      destroyPaymentWindow(paymentWindowRef.current);
      paymentWindowRef.current = null;
    },
    [],
  );

  // 결제창만 열고 즉시 반환한다. 결제수단 선택(paymentRequest) 시 confirmCharge가 실제 승인을 진행한다.
  async function requestCharge(amount: number) {
    if (isCharging) {
      return;
    }
    if (!clientKey) {
      toastAppError(APP_MESSAGE_CODE.error.donation.paymentWindowConfigMissing);
      return;
    }
    if (!customerKey || !isValidChargeAmount(amount)) {
      toastAppError(APP_MESSAGE_CODE.error.donation.invalidChargeAmount);
      return;
    }

    try {
      const prepared = await prepareTossWalletCharge(amount);
      // 지갑 충전 카드와 동일하게 결제위젯(widgets) 키를 사용한다. payment()(API 개별 연동)는 다른 키를
      // 요구해 "결제위젯 연동 키는 지원하지 않습니다" 오류가 난다.
      const widgets = (await loadTossPayments())(clientKey).widgets({ customerKey });
      await widgets.setAmount({ currency: "KRW", value: prepared.amount });

      destroyPaymentWindow(paymentWindowRef.current);
      paymentWindowRef.current = null;

      const paymentWindow = await widgets.renderPaymentWindow();
      paymentWindowRef.current = paymentWindow;

      let requested = false;
      paymentWindow.on("paymentRequest", () => {
        if (requested) {
          return;
        }
        requested = true;
        void confirmCharge(widgets, prepared);
      });
    } catch (error) {
      console.error("라이브 후원 충전 결제창 생성 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.donation.chargeFailed);
    }
  }

  // 결제수단 선택 후 실제 승인. PC는 Promise로 결과를 받아 직접 confirm, 모바일은 리다이렉트로 폴백한다.
  async function confirmCharge(widgets: TossPaymentsWidgets, prepared: PreparedCharge) {
    setIsCharging(true);
    try {
      if (isMobile) {
        // 모바일: 카드사 앱으로 리다이렉트되어 Promise를 받을 수 없으므로 successUrl/failUrl로 복귀한다.
        const returnToQuery = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
        await widgets.requestPayment({
          orderId: prepared.orderId,
          orderName: prepared.orderName,
          windowTarget: "self",
          successUrl: `${window.location.origin}/user/donations/toss/success${returnToQuery}`,
          failUrl: `${window.location.origin}/user/donations/toss/fail${returnToQuery}`,
        });
        // 위 호출이 현재 페이지를 결제창으로 이동시키므로 여기 도달하면 곧 언로드된다.
        return;
      }

      // PC: Promise 방식 — 리다이렉트 없이 결과(paymentKey/orderId)를 받아 직접 승인 확정한다.
      const result = await widgets.requestPayment({
        orderId: prepared.orderId,
        orderName: prepared.orderName,
        windowTarget: "iframe",
      });

      const confirmResponse = await fetch("/api/payments/toss/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentKey: result.paymentKey,
          orderId: result.orderId,
          // 금액은 우리가 prepare한 값을 그대로 보내 서버 검증과 일치시킨다.
          amount: prepared.amount,
        }),
      });

      if (!confirmResponse.ok) {
        console.error("Toss 결제 승인 실패", confirmResponse.status);
        toastAppError(APP_MESSAGE_CODE.error.donation.chargeFailed);
        return;
      }

      // 잔액 재조회 → 후원 모달의 보유 후원금이 충전분만큼 갱신된다(페이지 리로드 없이).
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.donations.walletBalance(customerKey),
      });
      toastAppSuccess(APP_MESSAGE_CODE.success.donation.chargeConfirmed);
      onChargeSuccess?.();
    } catch (error) {
      // 사용자가 결제창/QR을 닫으면 reject — 취소는 실패가 아니므로 안내 토스트만 띄운다.
      if (isTossPaymentCancelError(error)) {
        toastAppInfo(APP_MESSAGE_CODE.error.donation.chargeCanceled);
        return;
      }
      console.error("라이브 후원 충전 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.donation.chargeFailed);
    } finally {
      setIsCharging(false);
      destroyPaymentWindow(paymentWindowRef.current);
      paymentWindowRef.current = null;
      onChargeSettled?.();
    }
  }

  return { requestCharge, isCharging, isConfigured: Boolean(clientKey) };
}

function destroyPaymentWindow(paymentWindow: TossPaymentsPaymentWindow | null) {
  if (!paymentWindow) {
    return;
  }

  try {
    const result = paymentWindow.destroy();
    if (result instanceof Promise) {
      void result.catch(() => undefined);
    }
  } catch {
    // 이미 정리되었거나 destroy 미지원이면 무시한다.
  }
}

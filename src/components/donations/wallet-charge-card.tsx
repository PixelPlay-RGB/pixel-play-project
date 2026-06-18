"use client";
// 후원 지갑 충전 결제창을 열기 위한 금액 입력 UI를 제공합니다.

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import {
  WALLET_CHARGE_DEFAULT_AMOUNT,
  WALLET_CHARGE_MAX_AMOUNT,
  WALLET_CHARGE_MIN_AMOUNT,
  WALLET_CHARGE_PRESET_AMOUNTS,
  WALLET_CHARGE_STEP_AMOUNT,
} from "@/constants/payments/wallet-charge";
import { cn } from "@/lib/utils";
import type {
  TossPaymentsPaymentWindow,
  TossPaymentsWidgets,
} from "@/types/payments/toss-payments";
import { getAppMessage } from "@/utils/common/app-message";
import { toastAppError, toastAppInfo } from "@/utils/common/toast-message";
import { formatPoint } from "@/utils/donations/format";
import { TOSS_PAYMENTS_SDK_URL } from "@/utils/payments/toss-sdk";
import {
  isTossPaymentCancelError,
  isValidChargeAmount,
  prepareTossWalletCharge,
} from "@/utils/payments/toss-wallet-charge-client";
import { CreditCard, Loader2 } from "lucide-react";
import Script from "next/script";
import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";

interface Props {
  customerKey: string;
}

type PaymentWindowState = "idle" | "initializing" | "ready" | "opening" | "failed";

export function WalletChargeCard({ customerKey }: Props) {
  const amountInputId = useId();
  const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY;
  const [amount, setAmount] = useState(String(WALLET_CHARGE_DEFAULT_AMOUNT));
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isPaymentInitialized, setIsPaymentInitialized] = useState(false);
  const [paymentWindowState, setPaymentWindowState] = useState<PaymentWindowState>("idle");
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
  const paymentWindowRef = useRef<TossPaymentsPaymentWindow | null>(null);

  const numericAmount = useMemo(() => Number(amount), [amount]);
  const isValidAmount = isValidChargeAmount(numericAmount);
  const isBusy = paymentWindowState === "initializing" || paymentWindowState === "opening";
  const canRequestPayment =
    Boolean(clientKey) &&
    isSdkLoaded &&
    isPaymentInitialized &&
    paymentWindowState !== "initializing" &&
    paymentWindowState !== "opening" &&
    isValidAmount;

  useEffect(() => {
    if (!clientKey || !customerKey || !isSdkLoaded || !window.TossPayments) {
      return;
    }

    let isActive = true;

    try {
      const tossPayments = window.TossPayments(clientKey);
      const widgets = tossPayments.widgets({ customerKey });

      widgetsRef.current = widgets;
      queueActiveUpdate(
        () => isActive,
        () => {
          setIsPaymentInitialized(true);
          setPaymentWindowState("ready");
        },
      );
    } catch (error) {
      console.error("Toss Payments 결제창 초기화 실패", error);
      queueActiveUpdate(
        () => isActive,
        () => {
          setIsPaymentInitialized(false);
          setPaymentWindowState("failed");
        },
      );
    }

    return () => {
      isActive = false;
      destroyTossPaymentWindow(paymentWindowRef.current);
      paymentWindowRef.current = null;
      widgetsRef.current = null;
    };
  }, [clientKey, customerKey, isSdkLoaded]);

  useEffect(() => {
    const widgets = widgetsRef.current;

    if (!widgets || !isPaymentInitialized || !isValidAmount) {
      return;
    }

    let isActive = true;

    widgets.setAmount({ currency: "KRW", value: numericAmount }).catch((error: unknown) => {
      console.error("Toss Payments 결제위젯 금액 동기화 실패", error);

      if (isActive) {
        setPaymentWindowState("failed");
      }
    });

    return () => {
      isActive = false;
    };
  }, [isPaymentInitialized, isValidAmount, numericAmount]);

  const handleSdkReady = () => {
    setIsPaymentInitialized(false);
    setPaymentWindowState("initializing");
    setIsSdkLoaded(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const widgets = widgetsRef.current;

    if (!widgets || !canRequestPayment) {
      return;
    }

    try {
      setPaymentWindowState("opening");
      const preparedPayment = await prepareTossWalletCharge(numericAmount);

      await widgets.setAmount({ currency: "KRW", value: preparedPayment.amount });
      destroyTossPaymentWindow(paymentWindowRef.current);

      const paymentWindow = await widgets.renderPaymentWindow();
      let hasRequestedPayment = false;

      paymentWindowRef.current = paymentWindow;
      paymentWindow.on("paymentRequest", async () => {
        if (hasRequestedPayment) {
          return;
        }

        try {
          hasRequestedPayment = true;
          setPaymentWindowState("opening");
          await widgets.requestPayment({
            orderId: preparedPayment.orderId,
            orderName: preparedPayment.orderName,
            successUrl: `${window.location.origin}/user/donations/toss/success`,
            failUrl: `${window.location.origin}/user/donations/toss/fail`,
          });
        } catch (error) {
          // 사용자가 결제창을 닫으면(취소) requestPayment가 reject한다 — 에러가 아니므로
          // 콘솔 에러/실패 상태 대신 안내 토스트만 띄우고 다시 결제할 수 있게 ready로 되돌린다.
          hasRequestedPayment = false;
          if (isTossPaymentCancelError(error)) {
            toastAppInfo(APP_MESSAGE_CODE.info.donation.chargeCanceled);
            setPaymentWindowState("ready");
            return;
          }
          console.error("Toss Payments 결제위젯 결제 요청 실패", error);
          setPaymentWindowState("failed");
          toastAppError(APP_MESSAGE_CODE.error.donation.chargeFailed);
        }
      });

      setPaymentWindowState("ready");
    } catch (error) {
      console.error("Toss Payments 결제창 요청 실패", error);
      setPaymentWindowState("failed");
      toastAppError(APP_MESSAGE_CODE.error.donation.chargeFailed);
    }
  };

  const content = (
    <>
      {clientKey ? (
        <Script
          src={TOSS_PAYMENTS_SDK_URL}
          strategy="afterInteractive"
          onReady={handleSdkReady}
          onError={() => {
            setIsPaymentInitialized(false);
            setPaymentWindowState("failed");
          }}
        />
      ) : null}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2">
          {WALLET_CHARGE_PRESET_AMOUNTS.map((presetAmount) => {
            const isSelected = numericAmount === presetAmount;

            return (
              <Button
                key={presetAmount}
                type="button"
                variant={isSelected ? "default" : "outline"}
                aria-pressed={isSelected}
                className={cn(
                  "h-10",
                  isSelected && "bg-brand hover:bg-brand/90 text-brand-foreground",
                )}
                onClick={() => setAmount(String(presetAmount))}
              >
                {formatPoint(presetAmount)}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={amountInputId}>직접 입력</Label>
          <div className="relative">
            <Input
              id={amountInputId}
              type="number"
              inputMode="numeric"
              min={WALLET_CHARGE_MIN_AMOUNT}
              max={WALLET_CHARGE_MAX_AMOUNT}
              step={WALLET_CHARGE_STEP_AMOUNT}
              value={amount}
              aria-invalid={!isValidAmount}
              className="pr-10"
              onChange={(event) => setAmount(event.target.value)}
            />
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
              P
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            1,000P부터 1,000,000P까지 1,000P 단위로 충전할 수 있습니다.
          </p>
        </div>

        <div className="bg-muted/40 flex items-center justify-between gap-3 rounded-lg px-4 py-3">
          <span className="text-muted-foreground text-sm">충전 예정 포인트</span>
          <strong className="text-foreground text-base">
            {isValidAmount ? formatPoint(numericAmount) : "0P"}
          </strong>
        </div>

        {getPaymentStateMessage(clientKey, paymentWindowState) ? (
          <p className="text-muted-foreground text-xs">
            {getPaymentStateMessage(clientKey, paymentWindowState)}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={!canRequestPayment || isBusy} className="w-full">
          {isBusy ? <Loader2 className="animate-spin" /> : <CreditCard />}
          {getPaymentButtonLabel(clientKey, paymentWindowState)}
        </Button>
      </form>
    </>
  );

  return <div className="flex flex-col gap-4">{content}</div>;
}

function queueActiveUpdate(isActive: () => boolean, update: () => void) {
  Promise.resolve().then(() => {
    if (isActive()) {
      update();
    }
  });
}

function destroyTossPaymentWindow(paymentWindow: TossPaymentsPaymentWindow | null) {
  if (!paymentWindow) {
    return;
  }

  try {
    const result = paymentWindow.destroy();

    if (result instanceof Promise) {
      void result.catch(() => undefined);
    }
  } catch {
    return;
  }
}

function getPaymentButtonLabel(clientKey: string | undefined, state: PaymentWindowState) {
  if (!clientKey) {
    return "결제 키 필요";
  }

  if (state === "initializing") {
    return "결제창 준비 중";
  }

  if (state === "opening") {
    return "결제창 여는 중";
  }

  return "토스로 충전하기";
}

function getPaymentStateMessage(clientKey: string | undefined, state: PaymentWindowState) {
  if (!clientKey) {
    return (
      getAppMessage(APP_MESSAGE_CODE.error.donation.paymentWindowConfigMissing).description ?? ""
    );
  }

  if (state === "failed") {
    return getAppMessage(APP_MESSAGE_CODE.error.donation.paymentWindowLoadFailed).description ?? "";
  }

  return "";
}

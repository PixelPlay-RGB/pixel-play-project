"use client";
// 후원 지갑 충전 결제위젯을 제공합니다.

import { SettingsCard } from "@/components/common/settings-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  WALLET_CHARGE_DEFAULT_AMOUNT,
  WALLET_CHARGE_MAX_AMOUNT,
  WALLET_CHARGE_MIN_AMOUNT,
  WALLET_CHARGE_PRESET_AMOUNTS,
  WALLET_CHARGE_STEP_AMOUNT,
} from "@/constants/payments/wallet-charge";
import { cn } from "@/lib/utils";
import type { TossPaymentPrepareResponse } from "@/types/payments/toss-payment-api";
import type {
  TossPaymentsPaymentWindow,
  TossPaymentsWidgets,
} from "@/types/payments/toss-payments";
import { CreditCard, Loader2 } from "lucide-react";
import Script from "next/script";
import { FormEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

interface Props {
  customerKey: string;
}

type PaymentWidgetState = "idle" | "initializing" | "ready" | "opening" | "failed";

const TOSS_PAYMENTS_SDK_URL = "https://js.tosspayments.com/v2/standard";

export function WalletChargeCard({ customerKey }: Props) {
  const amountInputId = useId();
  const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY;
  const [amount, setAmount] = useState(String(WALLET_CHARGE_DEFAULT_AMOUNT));
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [paymentWidgetState, setPaymentWidgetState] = useState<PaymentWidgetState>("idle");
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
  const paymentWindowRef = useRef<TossPaymentsPaymentWindow | null>(null);
  const amountRef = useRef<number>(WALLET_CHARGE_DEFAULT_AMOUNT);

  const numericAmount = useMemo(() => Number(amount), [amount]);
  const isValidAmount = isValidChargeAmount(numericAmount);
  const isBusy = paymentWidgetState === "initializing" || paymentWidgetState === "opening";
  const canRequestPayment =
    Boolean(clientKey) && isSdkLoaded && paymentWidgetState === "ready" && isValidAmount;

  useEffect(() => {
    amountRef.current = numericAmount;
  }, [numericAmount]);

  useEffect(() => {
    if (!clientKey || !customerKey || !isSdkLoaded || !window.TossPayments) {
      return;
    }

    let isActive = true;
    const tossPayments = window.TossPayments(clientKey);
    const widgets = tossPayments.widgets({ customerKey });

    widgetsRef.current = widgets;

    widgets
      .setAmount({ currency: "KRW", value: WALLET_CHARGE_DEFAULT_AMOUNT })
      .then(() => {
        if (isActive) {
          setPaymentWidgetState("ready");
        }
      })
      .catch((error) => {
        console.error("Toss Payments 결제 금액 초기화 실패", error);
        if (isActive) {
          setPaymentWidgetState("failed");
        }
      });

    return () => {
      isActive = false;
      widgetsRef.current = null;
      void paymentWindowRef.current?.destroy();
      paymentWindowRef.current = null;
    };
  }, [clientKey, customerKey, isSdkLoaded]);

  useEffect(() => {
    if (!widgetsRef.current || !isValidAmount) {
      return;
    }

    let isActive = true;

    widgetsRef.current
      .setAmount({ currency: "KRW", value: numericAmount })
      .then(() => {
        if (isActive && paymentWidgetState === "failed") {
          setPaymentWidgetState("ready");
        }
      })
      .catch((error) => {
        console.error("Toss Payments 결제 금액 동기화 실패", error);
        if (isActive) {
          setPaymentWidgetState("failed");
        }
      });

    return () => {
      isActive = false;
    };
  }, [isValidAmount, numericAmount, paymentWidgetState]);

  const requestPayment = useCallback(async (widgets: TossPaymentsWidgets) => {
    const currentAmount = amountRef.current;

    if (!isValidChargeAmount(currentAmount)) {
      return;
    }

    try {
      const preparedPayment = await prepareTossWalletCharge(currentAmount);
      await widgets.setAmount({ currency: "KRW", value: preparedPayment.amount });
      await widgets.requestPayment({
        orderId: preparedPayment.orderId,
        orderName: preparedPayment.orderName,
        successUrl: `${window.location.origin}/user/donations/toss/success`,
        failUrl: `${window.location.origin}/user/donations/toss/fail`,
      });
    } catch (error) {
      console.error("Toss Payments 결제 요청 실패", error);
      setPaymentWidgetState("failed");
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const widgets = widgetsRef.current;

    if (!widgets || !canRequestPayment) {
      return;
    }

    try {
      setPaymentWidgetState("opening");
      await widgets.setAmount({ currency: "KRW", value: numericAmount });

      if (paymentWindowRef.current) {
        await paymentWindowRef.current.destroy();
        paymentWindowRef.current = null;
      }

      const paymentWindow = await widgets.renderPaymentWindow();
      paymentWindowRef.current = paymentWindow;
      paymentWindow.on("paymentRequest", () => requestPayment(widgets));
      setPaymentWidgetState("ready");
    } catch (error) {
      console.error("Toss Payments 결제창 렌더링 실패", error);
      setPaymentWidgetState("failed");
    }
  };

  return (
    <SettingsCard
      title="지갑 충전"
      description="충전 금액을 선택하거나 직접 입력할 수 있습니다."
      contentClassName="gap-4"
    >
      {clientKey ? (
        <Script
          src={TOSS_PAYMENTS_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => {
            setPaymentWidgetState("initializing");
            setIsSdkLoaded(true);
          }}
          onError={() => setPaymentWidgetState("failed")}
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
                className={cn("h-10", isSelected && "bg-brand hover:bg-brand/90")}
                onClick={() => setAmount(String(presetAmount))}
              >
                {formatWon(presetAmount)}
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
              원
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            1,000원부터 1,000,000원까지 1,000원 단위로 충전할 수 있습니다.
          </p>
        </div>

        <div className="bg-muted/40 flex items-center justify-between gap-3 rounded-lg px-4 py-3">
          <span className="text-muted-foreground text-sm">충전 예정 금액</span>
          <strong className="text-foreground text-base">
            {isValidAmount ? formatWon(numericAmount) : "0원"}
          </strong>
        </div>

        {getPaymentStateMessage(clientKey, paymentWidgetState) ? (
          <p className="text-muted-foreground text-xs">
            {getPaymentStateMessage(clientKey, paymentWidgetState)}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={!canRequestPayment || isBusy} className="w-full">
          {isBusy ? <Loader2 className="animate-spin" /> : <CreditCard />}
          {getPaymentButtonLabel(clientKey, paymentWidgetState)}
        </Button>
      </form>
    </SettingsCard>
  );
}

function getPaymentButtonLabel(clientKey: string | undefined, state: PaymentWidgetState) {
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

function getPaymentStateMessage(clientKey: string | undefined, state: PaymentWidgetState) {
  if (!clientKey) {
    return "NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY를 설정하면 결제창을 사용할 수 있습니다.";
  }

  if (state === "failed") {
    return "결제창을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
  }

  return "";
}

async function prepareTossWalletCharge(amount: number) {
  const response = await fetch("/api/payments/toss/prepare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    throw new Error("Toss 결제 준비 실패");
  }

  const data = (await response.json()) as unknown;

  if (!isTossPaymentPrepareResponse(data)) {
    throw new Error("Toss 결제 준비 응답 형식 오류");
  }

  return data;
}

function isTossPaymentPrepareResponse(value: unknown): value is TossPaymentPrepareResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Partial<TossPaymentPrepareResponse>;

  return (
    typeof response.orderId === "string" &&
    typeof response.orderName === "string" &&
    isValidChargeAmount(response.amount)
  );
}

function isValidChargeAmount(value: number | undefined) {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= WALLET_CHARGE_MIN_AMOUNT &&
    value <= WALLET_CHARGE_MAX_AMOUNT &&
    value % WALLET_CHARGE_STEP_AMOUNT === 0
  );
}

function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

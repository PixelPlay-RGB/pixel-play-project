"use client";
// 후원 지갑 충전 결제창을 열기 위한 금액 입력 UI를 제공합니다.

import { SettingsCard } from "@/components/common/settings-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import type { TossPaymentsPayment } from "@/types/payments/toss-payments";
import { CreditCard, Eye, Loader2 } from "lucide-react";
import Script from "next/script";
import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";

interface Props {
  customerKey: string;
  variant?: "card" | "plain";
}

interface WalletChargeDialogProps {
  customerKey: string;
  className?: string;
}

type PaymentWindowState = "idle" | "initializing" | "ready" | "opening" | "failed";

const TOSS_PAYMENTS_SDK_URL = "https://js.tosspayments.com/v2/standard";

export function WalletChargeDialog({ customerKey, className }: WalletChargeDialogProps) {
  const trigger = (
    <Button
      type="button"
      className={cn(
        "bg-background text-live hover:bg-background/90 h-10 px-4 font-black shadow-sm",
        "dark:text-live dark:bg-white dark:hover:bg-white/90",
        className,
      )}
    >
      <CreditCard className="size-4" />
      충전하기
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent
        className={cn(
          "overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-lg",
          "border-live/20 shadow-live/10 dark:border-live/10",
        )}
      >
        <DialogHeader className="border-live/10 bg-live/5 border-b px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <span className="bg-live/10 text-live ring-live/20 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
              <CreditCard className="size-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold">포인트 충전</DialogTitle>
              <DialogDescription className="mt-1 leading-relaxed">
                충전할 포인트를 선택하고 Toss Payments 결제창으로 결제를 진행합니다.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-5 pt-1 pb-5">
          <WalletChargeCard customerKey={customerKey} variant="plain" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WalletChargeCard({ customerKey, variant = "card" }: Props) {
  const amountInputId = useId();
  const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY;
  const [amount, setAmount] = useState(String(WALLET_CHARGE_DEFAULT_AMOUNT));
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isPaymentInitialized, setIsPaymentInitialized] = useState(false);
  const [paymentWindowState, setPaymentWindowState] = useState<PaymentWindowState>("idle");
  const paymentRef = useRef<TossPaymentsPayment | null>(null);

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
      const payment = tossPayments.payment({ customerKey });

      paymentRef.current = payment;
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
      destroyTossPayment(paymentRef.current);
      paymentRef.current = null;
    };
  }, [clientKey, customerKey, isSdkLoaded]);

  const handleSdkReady = () => {
    setIsPaymentInitialized(false);
    setPaymentWindowState("initializing");
    setIsSdkLoaded(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payment = paymentRef.current;

    if (!payment || !canRequestPayment) {
      return;
    }

    try {
      setPaymentWindowState("opening");
      const preparedPayment = await prepareTossWalletCharge(numericAmount);

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: preparedPayment.amount },
        orderId: preparedPayment.orderId,
        orderName: preparedPayment.orderName,
        successUrl: `${window.location.origin}/user/donations/toss/success`,
        failUrl: `${window.location.origin}/user/donations/toss/fail`,
      });

      setPaymentWindowState("ready");
    } catch (error) {
      console.error("Toss Payments 결제창 요청 실패", error);
      setPaymentWindowState("failed");
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
                className={cn("h-10", isSelected && "bg-brand hover:bg-brand/90")}
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

        <div className="grid gap-2 sm:grid-cols-2">
          <WalletChargePreviewDialog amount={numericAmount} disabled={!isValidAmount || isBusy} />
          <Button
            type="submit"
            size="lg"
            disabled={!canRequestPayment || isBusy}
            className="w-full"
          >
            {isBusy ? <Loader2 className="animate-spin" /> : <CreditCard />}
            {getPaymentButtonLabel(clientKey, paymentWindowState)}
          </Button>
        </div>
      </form>
    </>
  );

  if (variant === "plain") {
    return <div className="flex flex-col gap-4">{content}</div>;
  }

  return (
    <SettingsCard
      title="지갑 충전"
      description="충전 금액을 선택하거나 직접 입력할 수 있습니다."
      contentClassName="gap-4"
    >
      {content}
    </SettingsCard>
  );
}

function WalletChargePreviewDialog({ amount, disabled }: { amount: number; disabled: boolean }) {
  const trigger = (
    <Button type="button" variant="outline" size="lg" disabled={disabled} className="w-full">
      <Eye className="size-4" />
      미리보기
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent
        className={cn(
          "overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-md",
          "border-live/20 shadow-live/10 dark:border-live/10",
        )}
      >
        <DialogHeader className="bg-background border-b px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-black">Toss Payments</DialogTitle>
              <DialogDescription className="mt-1">후원 지갑 충전</DialogDescription>
            </div>
            <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-bold">
              미리보기
            </span>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 py-5">
          <section className="bg-muted/40 rounded-xl p-4">
            <p className="text-muted-foreground text-xs font-bold">결제 금액</p>
            <p className="text-foreground mt-2 text-3xl leading-none font-black">
              {formatPoint(amount)}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              주문명: 후원 지갑 충전 {formatPoint(amount)}
            </p>
          </section>

          <section className="grid gap-2">
            <PreviewPaymentMethod label="카드" isSelected />
            <PreviewPaymentMethod label="간편결제" />
            <PreviewPaymentMethod label="계좌이체" />
          </section>

          <Button type="button" size="lg" className="w-full" disabled>
            결제하기
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            실제 결제와 주문 생성은 진행되지 않습니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewPaymentMethod({
  label,
  isSelected = false,
}: {
  label: string;
  isSelected?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-12 items-center justify-between rounded-lg border px-4 text-sm font-bold",
        isSelected ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground",
      )}
    >
      <span>{label}</span>
      {isSelected ? <span className="text-xs">선택됨</span> : null}
    </div>
  );
}

function queueActiveUpdate(isActive: () => boolean, update: () => void) {
  Promise.resolve().then(() => {
    if (isActive()) {
      update();
    }
  });
}

function destroyTossPayment(payment: TossPaymentsPayment | null) {
  if (!payment) {
    return;
  }

  try {
    const result = payment.destroy();

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

function formatPoint(amount: number) {
  return `${amount.toLocaleString("ko-KR")}P`;
}

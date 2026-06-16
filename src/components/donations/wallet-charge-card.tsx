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
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
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
import { getAppMessage } from "@/utils/common/app-message";
import { formatPoint } from "@/utils/donations/format";
import { CreditCard, Loader2 } from "lucide-react";
import Script from "next/script";
import { FormEvent, useEffect, useId, useMemo, useRef, useState, type ReactElement } from "react";

interface Props {
  customerKey: string;
  variant?: "card" | "plain";
}

interface WalletChargeDialogProps {
  customerKey: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactElement | null;
}

type PaymentWindowState = "idle" | "initializing" | "ready" | "opening" | "failed";

const TOSS_PAYMENTS_SDK_URL = "https://js.tosspayments.com/v2/standard";

export function WalletChargeDialog({
  customerKey,
  className,
  open,
  onOpenChange,
  trigger,
}: WalletChargeDialogProps) {
  const defaultTrigger = (
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger !== null ? <DialogTrigger render={trigger ?? defaultTrigger} /> : null}
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
          console.error("Toss Payments 결제위젯 결제 요청 실패", error);
          hasRequestedPayment = false;
          setPaymentWindowState("failed");
        }
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

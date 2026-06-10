"use client";

import { useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LIVE_DONATION_AMOUNTS,
  LIVE_DONATION_LABEL,
  LIVE_DONATION_MESSAGE_MAX_LENGTH,
  LIVE_DONATION_MIN_AMOUNT,
  LIVE_LABEL,
} from "@/constants/live/live";
import { cn } from "@/lib/utils";
import { formatDonationAmount } from "@/utils/live/live-chat";

interface Props {
  onLoginPrompt: () => void;
  isLoggedIn: boolean;
  walletBalance: number;
  isWalletLoading?: boolean;
  isWalletError?: boolean;
  donationEnabled: boolean;
  donationMinAmount: number;
  onDonate: (params: {
    amount: number;
    message: string;
    isAnonymous: boolean;
    idempotencyKey: string;
  }) => Promise<boolean>;
  // 방송 종료 등으로 후원 자체를 막을 때 트리거를 비활성화한다.
  disabled?: boolean;
  // 후원 모달을 전체화면 등 특정 요소 안에 띄울 때 포털 컨테이너를 지정한다(미지정=body).
  portalContainer?: HTMLElement | null;
  // 트리거를 커스텀(예: 전체화면 미니 사이드바의 아이콘 버튼)으로 교체한다. 미지정 시 기본 후원 버튼.
  trigger?: ReactElement;
}

export function LiveDonationDialog({
  onLoginPrompt,
  isLoggedIn,
  walletBalance,
  isWalletLoading,
  isWalletError,
  donationEnabled,
  donationMinAmount,
  onDonate,
  disabled = false,
  portalContainer,
  trigger,
}: Props) {
  const minimumAmount = donationMinAmount > 0 ? donationMinAmount : LIVE_DONATION_MIN_AMOUNT;
  const [open, setOpen] = useState(false);
  // 후원 금액은 직접 입력값(숫자 문자열) 하나를 단일 소스로 둔다. 금액 버튼은 이 값에 더한다.
  const [amountInput, setAmountInput] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amount = Number(amountInput) || 0;

  function resetForm() {
    setAmountInput("");
    setIsAnonymous(false);
    setMessage("");
  }

  function addAmount(delta: number) {
    setAmountInput(String(amount + delta));
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setOpen(false);
      resetForm();
      return;
    }
    // 방송 종료 등으로 막힌 경우 열지 않는다(커스텀 trigger는 버튼 disabled가 없어 여기서 함께 막아야 한다).
    // 이미 연 채 종료되면 닫지 않고(작성 중 메시지 보존) 제출 버튼만 disabled로 막는다 —
    // 투표 popover(무상태라 즉시 닫음)와 의도적으로 다른 정책. 종료 안내는 전역 토스트가 담당.
    if (disabled) {
      return;
    }
    if (!donationEnabled) {
      return;
    }
    if (!isLoggedIn) {
      onLoginPrompt();
      return;
    }
    setOpen(true);
  }

  const remaining = walletBalance - amount;
  const isBelowMin = amount < minimumAmount;
  const minAmountLabel = `${formatDonationAmount(minimumAmount)}${LIVE_DONATION_LABEL.unit}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger
          render={
            <Button
              // 라이브 상호작용(브랜드 민트 네온)과 같은 형태의 live 코랄 네온으로 톤을 맞춘다.
              className={cn(
                "h-11 flex-1 text-sm",
                "border-live/30 bg-live/10 text-live",
                "hover:border-live/50 hover:bg-live/18 dark:border-live/30 dark:bg-live/15 dark:text-live",
              )}
              size="sm"
              variant="outline"
              disabled={!donationEnabled || disabled}
              title={!donationEnabled ? LIVE_DONATION_LABEL.disabled : undefined}
            />
          }
        >
          {LIVE_LABEL.donate}
        </DialogTrigger>
      )}
      <DialogContent
        container={portalContainer}
        className="max-h-[calc(100vh-1rem)] overflow-y-auto sm:max-w-sm"
      >
        <DialogHeader>
          <DialogTitle>{LIVE_DONATION_LABEL.title}</DialogTitle>
          <DialogDescription>
            {LIVE_DONATION_LABEL.description.replace("{amount}", minAmountLabel)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="accent-live size-4"
            />
            {LIVE_DONATION_LABEL.anonymous}
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{LIVE_DONATION_LABEL.amountLabel}</span>
            <div className="grid grid-cols-3 gap-2">
              {LIVE_DONATION_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addAmount(preset)}
                  className={cn(
                    "h-auto px-2 py-2 text-sm",
                    "border-border text-foreground hover:border-live/50",
                  )}
                >
                  +{formatDonationAmount(preset)}
                  {LIVE_DONATION_LABEL.unit}
                </Button>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <Input
                type="text"
                inputMode="numeric"
                placeholder={LIVE_DONATION_LABEL.directInput.replace("{amount}", minAmountLabel)}
                className="text-sm"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, ""))}
              />
              {amountInput !== "" && isBelowMin && (
                <p className="text-destructive text-xs">
                  {LIVE_DONATION_LABEL.minAmountError.replace("{amount}", minAmountLabel)}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{LIVE_DONATION_LABEL.messageLabel}</span>
            <Textarea
              placeholder={LIVE_DONATION_LABEL.messagePlaceholder}
              value={message}
              maxLength={LIVE_DONATION_MESSAGE_MAX_LENGTH}
              onChange={(e) =>
                setMessage(e.target.value.slice(0, LIVE_DONATION_MESSAGE_MAX_LENGTH))
              }
              className="resize-none text-sm"
              rows={2}
            />
          </div>

          <div className="bg-muted/50 text-muted-foreground flex flex-col gap-1 rounded-lg px-3 py-2 text-xs">
            <div className="flex justify-between">
              <span>{LIVE_DONATION_LABEL.balance}</span>
              <span>
                {isWalletLoading
                  ? LIVE_DONATION_LABEL.balanceLoading
                  : isWalletError
                    ? LIVE_DONATION_LABEL.balanceError
                    : `${formatDonationAmount(walletBalance)}${LIVE_DONATION_LABEL.unit}`}
              </span>
            </div>
            <div className="text-foreground flex justify-between font-medium">
              <span>{LIVE_DONATION_LABEL.afterBalance}</span>
              <span className={cn(remaining < 0 && "text-destructive")}>
                {formatDonationAmount(Math.max(remaining, 0))}
                {LIVE_DONATION_LABEL.unit}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
            {LIVE_DONATION_LABEL.cancel}
          </Button>
          <Button
            type="button"
            disabled={
              disabled ||
              !donationEnabled ||
              isBelowMin ||
              remaining < 0 ||
              isSubmitting ||
              !!isWalletLoading ||
              !!isWalletError
            }
            className="bg-live hover:bg-live/90 text-live-foreground"
            onClick={() => {
              void (async () => {
                setIsSubmitting(true);
                try {
                  const success = await onDonate({
                    amount,
                    message,
                    isAnonymous,
                    idempotencyKey: crypto.randomUUID(),
                  });
                  if (success) {
                    setOpen(false);
                    resetForm();
                  }
                } finally {
                  setIsSubmitting(false);
                }
              })();
            }}
          >
            {LIVE_DONATION_LABEL.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

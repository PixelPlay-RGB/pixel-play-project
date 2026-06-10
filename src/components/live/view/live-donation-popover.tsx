"use client";
// 후원 popover — 라이브 상호작용(투표)과 같은 형태로 채팅 입력바 위에 띄웁니다.
// 전체화면 후원 버튼은 openRequested로 외부에서 열기를 요청하고, 닫힐 때 사유(donated/dismissed)를 돌려받는다.

import { useEffect, useRef, useState, type RefObject } from "react";
import { HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
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

export type LiveDonationCloseReason = "donated" | "dismissed";

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
  // 후원 popover를 전체화면 등 특정 요소 안에 띄울 때 포털 컨테이너를 지정한다(미지정=body).
  portalContainer?: HTMLElement | null;
  // popover 폭을 채팅 패널에 맞추기 위한 anchor(입력바 컨테이너). 투표 popover와 동일 방식.
  anchorRef?: RefObject<HTMLElement | null>;
  // 외부(전체화면 후원 버튼)에서 popover 열기를 요청한다. false→true 전이에 가드를 거쳐 연다.
  openRequested?: boolean;
  // 외부 요청으로 열린 popover가 닫힐 때 사유를 알린다(후원 완료/미완료 — 전체화면 복귀 판단용).
  onOpenRequestSettled?: (reason: LiveDonationCloseReason) => void;
}

export function LiveDonationPopover({
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
  anchorRef,
  openRequested = false,
  onOpenRequestSettled,
}: Props) {
  const minimumAmount = donationMinAmount > 0 ? donationMinAmount : LIVE_DONATION_MIN_AMOUNT;
  const [open, setOpen] = useState(false);
  // 후원 금액은 직접 입력값(숫자 문자열) 하나를 단일 소스로 둔다. 금액 버튼은 이 값에 더한다.
  const [amountInput, setAmountInput] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 외부 요청으로 열렸는지 — 닫힐 때 onOpenRequestSettled를 호출할지 결정한다.
  const isExternallyOpenedRef = useRef(false);
  // 초기값은 반드시 false — 전체화면 후원 버튼이 채팅 패널을 열며 이 컴포넌트가
  // openRequested=true 상태로 "첫 마운트"되므로, 초기값을 openRequested로 잡으면 전이를 놓친다.
  const prevRequestedRef = useRef(false);

  const amount = Number(amountInput) || 0;

  function resetForm() {
    setAmountInput("");
    setIsAnonymous(false);
    setMessage("");
  }

  function closeWith(reason: LiveDonationCloseReason) {
    setOpen(false);
    resetForm();
    if (isExternallyOpenedRef.current) {
      isExternallyOpenedRef.current = false;
      onOpenRequestSettled?.(reason);
    }
  }

  function addAmount(delta: number) {
    setAmountInput(String(amount + delta));
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      closeWith("dismissed");
      return;
    }
    // 방송 종료 등으로 막힌 경우 열지 않는다. 이미 연 채 종료되면 닫지 않고(작성 중 메시지 보존)
    // 제출 버튼만 disabled로 막는다 — 투표 popover(무상태라 즉시 닫음)와 의도적으로 다른 정책.
    if (disabled || !donationEnabled) {
      return;
    }
    if (!isLoggedIn) {
      onLoginPrompt();
      return;
    }
    setOpen(true);
  }

  // 외부 열기 요청 수신(false→true 전이): 가드를 통과하면 열고, 불가하면 즉시 dismissed로 응답한다.
  useEffect(() => {
    const isNewRequest = openRequested && !prevRequestedRef.current;
    prevRequestedRef.current = openRequested;
    if (!isNewRequest) return;

    if (disabled || !donationEnabled || !isLoggedIn) {
      if (!isLoggedIn) onLoginPrompt();
      onOpenRequestSettled?.("dismissed");
      return;
    }
    isExternallyOpenedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
  }, [openRequested, disabled, donationEnabled, isLoggedIn, onLoginPrompt, onOpenRequestSettled]);

  const remaining = walletBalance - amount;
  const isBelowMin = amount < minimumAmount;
  const minAmountLabel = `${formatDonationAmount(minimumAmount)}${LIVE_DONATION_LABEL.unit}`;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            // 라이브 상호작용(브랜드 민트 네온)과 같은 형태의 live 코랄 네온으로 톤을 맞춘다.
            className={cn(
              "h-9 flex-1 text-sm",
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
        <HandCoins className="size-4" />
        {LIVE_LABEL.donate}
      </PopoverTrigger>
      <PopoverContent
        anchor={anchorRef ? () => anchorRef.current : undefined}
        container={portalContainer}
        align="center"
        side="top"
        sideOffset={8}
        // 기본 collisionPadding(5px)이 popover를 패널 밖으로 밀어내므로 0으로 고정해 패널 안에 둔다.
        collisionPadding={0}
        // 채팅 아이템 좌우 패딩(px-3)만큼 패널보다 좁혀 답답하지 않게 띄운다.
        className="max-h-[calc(100vh-1rem)] w-[calc(var(--anchor-width)-1.5rem)] overflow-y-auto"
      >
        {/* 브랜드 무드 — 마크·후원 카드와 같은 brand→live 그라디언트 라인으로 후원 영역임을 드러낸다. */}
        <div className="from-brand to-live h-1 shrink-0 rounded-full bg-linear-to-r" />
        <PopoverHeader className="flex-row items-center gap-2.5">
          <span className="from-brand to-live inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white shadow-sm">
            <HandCoins className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <PopoverTitle>{LIVE_DONATION_LABEL.title}</PopoverTitle>
            <PopoverDescription>
              {LIVE_DONATION_LABEL.description.replace("{amount}", minAmountLabel)}
            </PopoverDescription>
          </div>
        </PopoverHeader>

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
              // field-sizing-content(자동 확장)가 popover 높이를 키우지 않게 최대 높이를 고정한다.
              className="max-h-20 resize-none text-sm"
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

        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => closeWith("dismissed")}
          >
            {LIVE_DONATION_LABEL.cancel}
          </Button>
          <Button
            type="button"
            size="sm"
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
                    closeWith("donated");
                  }
                } finally {
                  setIsSubmitting(false);
                }
              })();
            }}
          >
            {LIVE_DONATION_LABEL.submit}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";
// 후원 popover — 라이브 상호작용(투표)과 같은 형태로 채팅 입력바 위에 띄웁니다.
// 전체화면 후원 버튼은 openRequested로 외부에서 열기를 요청하고, 닫힐 때 사유(donated/dismissed)를 돌려받는다.

import { useEffect, useRef, useState, type RefObject } from "react";
import { CreditCard, HandCoins, Loader2 } from "lucide-react";
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
import {
  WALLET_CHARGE_MAX_AMOUNT,
  WALLET_CHARGE_MIN_AMOUNT,
  WALLET_CHARGE_STEP_AMOUNT,
} from "@/constants/payments/wallet-charge";
import { useTossWalletCharge } from "@/hooks/donations/use-toss-wallet-charge";
import { cn } from "@/lib/utils";
import { formatDonationAmount } from "@/utils/live/live-chat";
import { isValidChargeAmount } from "@/utils/payments/toss-wallet-charge-client";

export type LiveDonationCloseReason = "donated" | "dismissed";

interface Props {
  onLoginPrompt: () => void;
  isLoggedIn: boolean;
  walletBalance: number;
  isWalletLoading?: boolean;
  isWalletError?: boolean;
  // 후원금 충전(TossPayments) — customerKey는 로그인 유저 id, chargeReturnTo는 결제 후 복귀 경로.
  customerKey?: string;
  chargeReturnTo?: string;
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
  customerKey,
  chargeReturnTo,
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
  // 충전 결제창 때문에 popover가 닫히는 동안 입력값(후원 금액·메시지)을 보존하기 위한 플래그.
  // 사용자가 직접 닫은 게 아니므로 이 동안엔 resetForm/외부 정산을 보류한다.
  const isChargeFlowActiveRef = useRef(false);
  // TossPayments 충전(PC=Promise·리로드 없음 / 모바일=리다이렉트 폴백). 성공 시 잔액은 훅이 재조회한다.
  const { requestCharge, cancelCharge, isCharging, isConfigured } = useTossWalletCharge({
    customerKey,
    returnTo: chargeReturnTo,
    // 충전 승인되면 후원 모달을 다시 띄워(또는 유지) 갱신된 잔액을 보여준다.
    onChargeSuccess: () => setOpen(true),
    // 결제가 끝나면(성공/취소/실패) 보존 플래그를 해제해 이후 사용자 닫기 시 입력값이 정상 초기화되게 한다.
    onChargeSettled: () => {
      isChargeFlowActiveRef.current = false;
    },
  });
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

  function handleCharge(chargeValue: number) {
    // 결제창이 뜨면서 popover가 닫혀도 입력값을 보존하도록 플래그를 세운다(결제 성공 시 다시 연다).
    // 충전만 자동 처리하고, 잔액이 채워지면 버튼이 후원하기로 바뀌어 사용자가 후원을 확정한다.
    isChargeFlowActiveRef.current = true;
    void requestCharge(chargeValue);
  }

  function resetForm() {
    setAmountInput("");
    setIsAnonymous(false);
    setMessage("");
  }

  function closeWith(reason: LiveDonationCloseReason) {
    setOpen(false);
    // 충전 플로우를 정리한다(보존 플래그 해제 + 떠 있는 결제창 닫기). 결제 진행 중(isCharging) 닫기는
    // handleOpenChange/취소 버튼에서 막으므로 여기 도달하면 진행 중이 아니어서 안전하게 정산한다.
    // (보류만 하면 결제수단 선택 전에 결제창을 닫았을 때 외부 열기 latch가 고착돼 전체화면 후원 버튼이 죽는다.)
    isChargeFlowActiveRef.current = false;
    cancelCharge();
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
      // 결제 진행 중이거나 충전 플로우가 떠 있는 동안엔 바깥클릭/ESC로 닫지 않는다(결제 후 갱신 잔액·입력값 유지).
      // 닫으려면 취소 버튼을 쓴다 — 취소 버튼의 closeWith가 충전 플로우(결제창·플래그)를 명시적으로 정리한다.
      if (isCharging || isChargeFlowActiveRef.current) {
        return;
      }
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
    // 사용자가 직접 새로 여는 경우이므로 충전 보존 플래그를 초기화한다.
    isChargeFlowActiveRef.current = false;
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
    isChargeFlowActiveRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
  }, [openRequested, disabled, donationEnabled, isLoggedIn, onLoginPrompt, onOpenRequestSettled]);

  const remaining = walletBalance - amount;
  // 부족분(후원액 − 잔액). needsCharge/requiredCharge가 모두 이 값을 기준으로 삼는 단일 소스.
  const shortfall = Math.max(amount - walletBalance, 0);
  const isBelowMin = amount < minimumAmount;
  const minAmountLabel = `${formatDonationAmount(minimumAmount)}${LIVE_DONATION_LABEL.unit}`;
  const maxChargeLabel = `${formatDonationAmount(WALLET_CHARGE_MAX_AMOUNT)}${LIVE_DONATION_LABEL.unit}`;
  const hasBalanceInfo = !isWalletLoading && !isWalletError;
  // 부족분이 1회 충전 한도를 넘으면 충전해도 한 번에 못 메워(클램프) 무한 충전 루프가 되므로, 충전을 제안하지 않는다.
  const exceedsChargeLimit = shortfall > WALLET_CHARGE_MAX_AMOUNT;
  // 잔액이 부족할 때만(유효 금액·조회 완료·한도 내 전제) 하단 버튼을 후원하기 대신 자동 충전으로 전환한다.
  const needsCharge = hasBalanceInfo && !isBelowMin && amount > 0 && remaining < 0 && !exceedsChargeLimit;
  // 충전액 = 부족분을 1,000P 단위로 올림(치지직식). 최소/최대 한도로 클램프한다.
  const requiredCharge = Math.min(
    Math.max(
      Math.ceil(shortfall / WALLET_CHARGE_STEP_AMOUNT) * WALLET_CHARGE_STEP_AMOUNT,
      WALLET_CHARGE_MIN_AMOUNT,
    ),
    WALLET_CHARGE_MAX_AMOUNT,
  );
  // 미로그인(customerKey 없음)·키 미설정이면 충전 불가 → 후원하기(비활성)로 폴백한다.
  const canCharge = needsCharge && Boolean(customerKey) && isConfigured;
  // 충전 자체는 가능한 상태지만 부족분이 1회 한도를 초과해 충전으로 못 메우는 경우 안내한다.
  const showChargeLimitNotice =
    hasBalanceInfo &&
    !isBelowMin &&
    amount > 0 &&
    remaining < 0 &&
    exceedsChargeLimit &&
    Boolean(customerKey) &&
    isConfigured;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            // 라이브 상호작용(브랜드 민트 네온)과 같은 형태의 live 코랄 네온으로 톤을 맞춘다.
            // h-8: 입력 섹션을 낮게 유지하기 위한 슬림 높이(비디오 하단 라인 정렬용).
            className={cn(
              "h-8 flex-1 text-sm",
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
        sideOffset={0}
        // 기본 collisionPadding(5px)이 popover를 패널 밖으로 밀어내므로 0으로 고정해 패널 안에 둔다.
        collisionPadding={0}
        // 메시지 입력 등으로 popover가 길어져 위아래 공간이 부족하면 base-ui가 좌/우 축으로
        // 뒤집어(fallbackAxisSide) 채팅 패널 밖(비디오 위)으로 튀어나간다. 이를 막아 입력바 위/아래에만
        // 고정하고, 높이는 아래 max-h(--available-height)로 줄여 내부 스크롤로 처리한다.
        collisionAvoidance={{ fallbackAxisSide: "none" }}
        // 입력바(anchor) 풀폭 + 하단 직각으로 입력 섹션과 한 덩어리처럼 이어 붙인다.
        // 높이는 base-ui가 계산한 가용 높이로 캡해, 길어져도 패널을 벗어나지 않고 내부 스크롤된다.
        className="max-h-(--available-height) w-(--anchor-width) overflow-y-auto rounded-b-none"
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
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm leading-none">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="accent-live size-4 shrink-0"
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
                    "h-auto px-2 py-2 text-sm font-semibold",
                    "border-border text-foreground hover:border-live/50 hover:bg-live/10 hover:text-live",
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
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{LIVE_DONATION_LABEL.messageLabel}</span>
              {/* 커뮤니티 작성 폼과 같은 현재/최대 글자 수 표시(후원 메시지는 채팅 2000자와 달리 300자 제한). */}
              <span className="text-muted-foreground text-xs tabular-nums">
                {message.length} / {LIVE_DONATION_MESSAGE_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              placeholder={LIVE_DONATION_LABEL.messagePlaceholder}
              value={message}
              maxLength={LIVE_DONATION_MESSAGE_MAX_LENGTH}
              onChange={(e) =>
                setMessage(e.target.value.slice(0, LIVE_DONATION_MESSAGE_MAX_LENGTH))
              }
              // field-sizing-content(자동 확장)가 popover를 무한정 키우지 않게 최대 높이만 제한한다.
              // 긴 메시지(최대 300자)도 max-h 안에서 스크롤로 전부 확인할 수 있다.
              className="max-h-40 resize-none overflow-y-auto text-sm"
              rows={2}
            />
          </div>

          <div className="from-brand/10 to-live/10 border-border/60 text-muted-foreground flex flex-col gap-1 rounded-lg border bg-linear-to-r px-3 py-2.5 text-xs">
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

        {/* 잔액이 부족하면 후원은 사용자 확인이 필요하므로 충전 후 동작을 안내하고,
            부족분이 1회 충전 한도를 넘으면 금액을 낮추도록 안내한다. */}
        {canCharge ? (
          <p className="text-muted-foreground text-xs">{LIVE_DONATION_LABEL.chargeNotice}</p>
        ) : showChargeLimitNotice ? (
          <p className="text-destructive text-xs">
            {LIVE_DONATION_LABEL.chargeLimitExceeded.replace("{amount}", maxChargeLabel)}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isSubmitting || isCharging}
            onClick={() => closeWith("dismissed")}
          >
            {LIVE_DONATION_LABEL.cancel}
          </Button>
          {/* 잔액이 모자라면(로그인·키 설정 전제) 후원하기 대신 부족분 자동 충전 버튼으로 전환한다.
              충전만 자동 처리하고, 잔액이 채워지면 다시 후원하기로 바뀌어 사용자가 후원을 확정한다. */}
          {canCharge ? (
            <Button
              type="button"
              size="sm"
              disabled={isCharging || isSubmitting || !isValidChargeAmount(requiredCharge)}
              className="bg-live hover:bg-live/90 text-live-foreground"
              onClick={() => handleCharge(requiredCharge)}
            >
              {isCharging ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              {LIVE_DONATION_LABEL.chargeSubmit.replace(
                "{amount}",
                `${formatDonationAmount(requiredCharge)}${LIVE_DONATION_LABEL.unit}`,
              )}
            </Button>
          ) : (
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
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

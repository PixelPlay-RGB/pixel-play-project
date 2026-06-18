"use client";
// 라이브 시청자가 방송인 구독 혜택을 확인하고 포인트 결제로 구독을 시작하는 Popover입니다.

import { cloneElement, type ComponentProps, type ReactElement } from "react";
import Link from "next/link";
import { BadgeCheck, Heart, Smile, Star, WalletCards } from "lucide-react";

import { LiveSubscriptionBadge } from "@/components/live/chat/live-subscription-badge";
import { SubscriptionChannelEmojiPreview } from "@/components/subscriptions/subscription-channel-emoji-preview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CREATOR_AVATAR_TRIGGER_AVATAR_CLASS,
  CREATOR_AVATAR_TRIGGER_CLASS,
} from "@/constants/creator/creator";
import { CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT } from "@/constants/subscriptions/creator-subscription";
import { cn } from "@/lib/utils";
import type { ChannelEmoji } from "@/types/channel/channel-emoji";
import type { LiveCreator } from "@/types/live/live";
import { formatPoint } from "@/utils/donations/format";
import { buildLiveSubscriptionBadgeMonths } from "@/utils/live/live-subscription-badge";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  open: boolean;
  trigger: ReactElement<SubscribeTriggerProps>;
  creator: LiveCreator;
  isSubscribed: boolean;
  canSubscribe: boolean;
  isRenewalCanceled: boolean;
  isPending: boolean;
  walletBalance: number;
  isWalletLoading: boolean;
  isWalletError: boolean;
  subscriptionBadgeCustomMonths: number[];
  subscriptionBadgeVersion: string | null;
  subscriptionBadgeImageSources: Record<number, string>;
  subscriptionEmojis: ChannelEmoji[];
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

type SubscribeTriggerProps = ComponentProps<typeof Button>;
type SubscribeTriggerClickEvent = Parameters<NonNullable<SubscribeTriggerProps["onClick"]>>[0];
type PreventableSubscribeTriggerClickEvent = SubscribeTriggerClickEvent & {
  baseUIHandlerPrevented?: boolean;
  preventBaseUIHandler?: () => void;
};

const BENEFITS = [
  { icon: Heart, label: "후원 지갑 포인트로 매월 정기 구독" },
  { icon: BadgeCheck, label: "구독 기간에 맞는 전용 배지" },
] as const;

export function LiveSubscribeDialog({
  open,
  trigger,
  creator,
  isSubscribed,
  canSubscribe,
  isRenewalCanceled,
  isPending,
  walletBalance,
  isWalletLoading,
  isWalletError,
  subscriptionBadgeCustomMonths,
  subscriptionBadgeVersion,
  subscriptionBadgeImageSources,
  subscriptionEmojis,
  onOpenChange,
  onConfirm,
}: Props) {
  const fallback = getAvatarFallbackText(creator.name);
  const avatarSrc = getAvatarImageSrc(creator.avatarUrl);
  const badgeMonths = buildLiveSubscriptionBadgeMonths(subscriptionBadgeCustomMonths);
  const submitLabel =
    !canSubscribe && isSubscribed
      ? "이미 구독 중"
      : isRenewalCanceled
        ? "구독 다시 시작"
        : `${formatPoint(CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT)}로 구독하기`;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={renderSubscribeTrigger(trigger)} />
      <PopoverContent
        align="center"
        side="top"
        sideOffset={8}
        collisionPadding={8}
        className="flex max-h-dvh w-88 max-w-dvw flex-col gap-0 overflow-hidden p-0 sm:w-112"
      >
        <header className="border-border shrink-0 border-b p-5 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/channel/${creator.id}`}
              prefetch={false}
              aria-label={`${creator.name} 채널 보기`}
              className={CREATOR_AVATAR_TRIGGER_CLASS}
            >
              <Avatar
                size="lg"
                className={cn("ring-brand/70 ring-2", CREATOR_AVATAR_TRIGGER_AVATAR_CLASS)}
              >
                <AvatarImage src={avatarSrc} alt={`${creator.name} 프로필`} />
                <AvatarFallback>{fallback}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-black">{creator.name}</h2>
            </div>
          </div>
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-5 p-5">
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-black">
                <span className="text-brand">{creator.name}</span> 구독 혜택
              </h3>
              <div className="border-border overflow-hidden rounded-lg border">
                {BENEFITS.map((benefit) => (
                  <div
                    key={benefit.label}
                    className="border-border flex items-center gap-3 border-b px-3 py-3 last:border-b-0"
                  >
                    <benefit.icon className="text-muted-foreground size-4 shrink-0" />
                    <span className="text-sm font-medium">{benefit.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="from-brand/10 to-live/10 border-border/60 text-muted-foreground flex items-center justify-between gap-3 rounded-lg border bg-linear-to-r px-3 py-2.5 text-xs">
              <span>보유 포인트</span>
              <strong className="text-foreground font-medium">
                {isWalletLoading
                  ? "조회 중"
                  : isWalletError
                    ? "조회 실패"
                    : formatPoint(walletBalance)}
              </strong>
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Star className="text-brand size-4 fill-current" />
                <h3 className="text-sm font-black">구독자 전용 배지</h3>
              </div>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                {badgeMonths.map((month) => (
                  <div key={month} className="flex min-w-0 flex-col items-center gap-1.5">
                    <LiveSubscriptionBadge
                      creatorId={creator.id}
                      totalMonths={month}
                      customMonths={subscriptionBadgeCustomMonths}
                      version={subscriptionBadgeVersion}
                      imageSourcesByMonth={subscriptionBadgeImageSources}
                      size="lg"
                    />
                    <span className="text-muted-foreground text-xs">{month}개월</span>
                  </div>
                ))}
              </div>
            </section>

            {subscriptionEmojis.length > 0 ? (
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Smile className="text-brand size-4" />
                  <h3 className="text-sm font-black">구독자 전용 이모티콘</h3>
                </div>
                <SubscriptionChannelEmojiPreview emojis={subscriptionEmojis} />
              </section>
            ) : null}
          </div>
        </ScrollArea>

        <footer className="border-border mx-0 mb-0 flex shrink-0 flex-col items-stretch gap-3 border-t p-5">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs leading-5">
              매월 후원 지갑에서 {formatPoint(CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT)}가 사용됩니다.
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="bg-live hover:bg-live/90 h-11 w-full font-black text-white"
            disabled={!canSubscribe || isPending}
            onClick={onConfirm}
          >
            <WalletCards className="size-4" />
            {isPending ? "구독 처리 중" : submitLabel}
          </Button>
        </footer>
      </PopoverContent>
    </Popover>
  );
}

function renderSubscribeTrigger(trigger: ReactElement<SubscribeTriggerProps>) {
  return function subscribeTrigger(triggerProps: SubscribeTriggerProps) {
    const triggerOnClick = trigger.props.onClick;
    const popoverOnClick = triggerProps.onClick;

    return cloneElement(trigger, {
      ...triggerProps,
      ...trigger.props,
      className: cn(triggerProps.className, trigger.props.className),
      onClick: (event: SubscribeTriggerClickEvent) => {
        const preventableEvent = event as PreventableSubscribeTriggerClickEvent;

        preventableEvent.preventBaseUIHandler = () => {
          preventableEvent.baseUIHandlerPrevented = true;
        };

        triggerOnClick?.(event);
        if (!preventableEvent.baseUIHandlerPrevented) {
          popoverOnClick?.(event);
        }
      },
    });
  };
}

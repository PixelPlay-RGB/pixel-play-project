"use client";
// 라이브 시청자가 방송인 구독 혜택을 확인하고 포인트 결제로 구독을 시작하는 Popover입니다.

import type { ReactElement } from "react";
import { BadgeCheck, Heart, Star, WalletCards } from "lucide-react";

import { LiveSubscriptionBadge } from "@/components/live/chat/live-subscription-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LiveCreator } from "@/types/live/live";
import { CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT } from "@/constants/subscriptions/creator-subscription";
import { formatPoint } from "@/utils/donations/format";
import { buildLiveSubscriptionBadgeMonths } from "@/utils/live/live-subscription-badge";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  open: boolean;
  trigger: ReactElement;
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
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

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
      <PopoverTrigger render={trigger} />
      <PopoverContent
        align="center"
        side="top"
        sideOffset={8}
        collisionPadding={8}
        className="max-h-[calc(100vh-1rem)] w-88 max-w-[calc(100vw-1rem)] gap-0 overflow-hidden p-0 sm:w-112"
      >
        <header className="border-border border-b p-5 pb-4">
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="ring-brand/70 ring-2">
              <AvatarImage src={avatarSrc} alt={`${creator.name} 프로필`} />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-black">{creator.name}</h2>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                후원 지갑 포인트로 채널을 구독하고 구독 배지를 사용할 수 있어요.
              </p>
            </div>
          </div>
        </header>

        <ScrollArea className="max-h-120">
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

            <section className="bg-muted/35 border-border flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <WalletCards className="text-brand size-4 shrink-0" />
                <span className="text-sm font-black">보유 포인트</span>
              </div>
              <strong className="text-sm font-black">
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
          </div>
        </ScrollArea>

        <footer className="border-border mx-0 mb-0 flex flex-col items-stretch gap-3 border-t p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black">정기 구독 설명</p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                매월 후원 지갑에서 {formatPoint(CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT)}가 사용됩니다.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 text-xs">
              약관안내
            </Button>
          </div>
          <Button
            type="button"
            size="lg"
            className="bg-brand text-brand-foreground hover:bg-brand/90 h-11 w-full font-black"
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

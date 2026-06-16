"use client";
// 라이브 시청자가 방송인 구독 혜택을 확인하고 구독 결제를 시작하는 Popover입니다.

import type { ReactElement } from "react";
import { BadgeCheck, CreditCard, Heart, Star } from "lucide-react";

import { LiveSubscriptionBadge } from "@/components/live/chat/live-subscription-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LiveCreator } from "@/types/live/live";
import { buildLiveSubscriptionBadgeMonths } from "@/utils/live/live-subscription-badge";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

const LIVE_SUBSCRIPTION_PRICE = 4900;

interface Props {
  open: boolean;
  trigger: ReactElement;
  creator: LiveCreator;
  isSubscribed: boolean;
  isPending: boolean;
  subscriptionBadgeCustomMonths: number[];
  subscriptionBadgeVersion: string | null;
  subscriptionBadgeImageSources: Record<number, string>;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const BENEFITS = [
  { icon: Heart, label: "이 채널의 스트리머 자동 후원" },
  { icon: BadgeCheck, label: "구독 기간에 맞는 전용 배지" },
] as const;

function formatPrice(value: number) {
  return value.toLocaleString("ko-KR");
}

export function LiveSubscribeDialog({
  open,
  trigger,
  creator,
  isSubscribed,
  isPending,
  subscriptionBadgeCustomMonths,
  subscriptionBadgeVersion,
  subscriptionBadgeImageSources,
  onOpenChange,
  onConfirm,
}: Props) {
  const fallback = getAvatarFallbackText(creator.name);
  const avatarSrc = getAvatarImageSrc(creator.avatarUrl);
  const badgeMonths = buildLiveSubscriptionBadgeMonths(subscriptionBadgeCustomMonths);
  const submitLabel = isSubscribed
    ? "이미 구독 중"
    : `매월 ${formatPrice(LIVE_SUBSCRIPTION_PRICE)}원 결제하고 구독하기`;

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
                매월 정기구독으로 채널을 후원하고 구독 배지를 사용할 수 있어요.
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
                매월 자동 결제되는 구독 상품입니다.
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
            disabled={isSubscribed || isPending}
            onClick={onConfirm}
          >
            <CreditCard className="size-4" />
            {isPending ? "구독 처리 중" : submitLabel}
          </Button>
        </footer>
      </PopoverContent>
    </Popover>
  );
}

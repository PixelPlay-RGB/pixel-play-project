"use client";
// 사용자 구독 목록과 구독 관리 다이얼로그를 렌더링합니다.

import { useMemo, useState } from "react";
import { BadgeCheck, Heart, Sparkles, Star, WalletCards } from "lucide-react";

import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { LiveSubscriptionBadge } from "@/components/live/chat/live-subscription-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import { CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT } from "@/constants/subscriptions/creator-subscription";
import { useUserWalletBalance } from "@/hooks/donations/use-user-wallet-balance";
import { useUserSubscriptionManagement } from "@/hooks/subscriptions/use-user-subscription-management";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import type { CreatorSubscriptionStatus } from "@/types/live/live";
import type {
  UserSubscriptionItem,
  UserSubscriptionSnapshot,
} from "@/types/subscriptions/user-subscriptions";
import { getAppMessage } from "@/utils/common/app-message";
import { formatPoint } from "@/utils/donations/format";
import {
  buildLiveSubscriptionBadgeMonths,
  resolveLiveSubscriptionBadgeMonth,
} from "@/utils/live/live-subscription-badge";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import { canStartCreatorSubscription } from "@/utils/subscriptions/user-subscription-status";
import {
  getUserSubscriptionManagementPrimaryActionLabel,
  isUserSubscriptionRestartAction,
} from "@/utils/subscriptions/user-subscription-management-action";

type UserSubscriptionTab = "active" | "expired";

interface Props {
  snapshot: UserSubscriptionSnapshot | null;
  errorCode?: AppMessageCode;
}

const PAGE_HEADER = {
  kicker: "SUBSCRIPTIONS",
  title: "내 구독",
  description: "구독 중인 방송인의 배지와 다음 결제일을 확인합니다.",
} as const;

const TAB_ITEMS: Array<{ value: UserSubscriptionTab; label: string }> = [
  { value: "active", label: "구독중인 채널" },
  { value: "expired", label: "만료된 구독" },
];

const STATUS_META: Record<
  CreatorSubscriptionStatus | "ended",
  { label: string; className: string }
> = {
  active: { label: "구독중", className: "bg-brand/15 text-brand" },
  expired: { label: "만료", className: "bg-muted text-muted-foreground" },
  canceled: { label: "해지 예약", className: "bg-warning/15 text-warning" },
  ended: { label: "만료", className: "bg-muted text-muted-foreground" },
};

const SUBSCRIPTION_BENEFITS = [
  { icon: Heart, label: "후원 지갑 포인트로 매월 정기 구독" },
  { icon: BadgeCheck, label: "구독 기간에 맞는 전용 배지" },
] as const;

export function UserSubscriptionsPage({ snapshot, errorCode }: Props) {
  const [tab, setTab] = useState<UserSubscriptionTab>("active");
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscriptionItem | null>(
    null,
  );

  if (!snapshot) {
    const message = getAppMessage(errorCode);

    return (
      <SettingsPage {...PAGE_HEADER}>
        <SettingsCard title={message.title}>
          <p className="text-muted-foreground text-sm">{message.description}</p>
        </SettingsCard>
      </SettingsPage>
    );
  }

  const currentItems =
    tab === "active" ? snapshot.activeSubscriptions : snapshot.expiredSubscriptions;

  return (
    <SettingsPage {...PAGE_HEADER}>
      <SettingsCard contentClassName="gap-6">
        <Tabs value={tab} onValueChange={(value) => setTab(value as UserSubscriptionTab)}>
          <TabsList className="grid w-full grid-cols-2 sm:w-fit">
            {TAB_ITEMS.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="min-w-0 px-2 sm:px-4">
                <span className="truncate">{item.label}</span>
                <span className="text-xs tabular-nums">{getTabCount(snapshot, item.value)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <SubscriptionList
          tab={tab}
          items={currentItems}
          onManage={(subscription) => setSelectedSubscription(subscription)}
        />
      </SettingsCard>

      <SubscriptionPolicyNotice />

      <UserSubscriptionManagementDialog
        subscription={selectedSubscription}
        open={Boolean(selectedSubscription)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSubscription(null);
          }
        }}
      />
    </SettingsPage>
  );
}

function SubscriptionList({
  tab,
  items,
  onManage,
}: {
  tab: UserSubscriptionTab;
  items: UserSubscriptionItem[];
  onManage: (subscription: UserSubscriptionItem) => void;
}) {
  if (items.length === 0) {
    return (
      <SubscriptionEmptyState
        title={tab === "active" ? "구독중인 채널이 없습니다." : "만료된 구독이 없습니다."}
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((subscription) => (
        <SubscriptionCard
          key={subscription.id}
          subscription={subscription}
          onManage={() => onManage(subscription)}
        />
      ))}
    </div>
  );
}

function SubscriptionCard({
  subscription,
  onManage,
}: {
  subscription: UserSubscriptionItem;
  onManage: () => void;
}) {
  const statusMeta = getSubscriptionStatusMeta(subscription);
  const avatarSrc = getAvatarImageSrc(subscription.creatorPhotoUrl);
  const fallbackText = getAvatarFallbackText(subscription.creatorNickname);

  return (
    <article className="border-border bg-background flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="size-14">
          <AvatarImage src={avatarSrc} alt={`${subscription.creatorNickname} 프로필`} />
          <AvatarFallback>{fallbackText}</AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h3 className="text-foreground truncate text-base font-black">
              {subscription.creatorNickname}
            </h3>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-black whitespace-nowrap",
                statusMeta.className,
              )}
            >
              {statusMeta.label}
            </span>
          </div>

          <p className="text-brand mt-1 text-sm font-bold">
            {subscription.totalMonths.toLocaleString("ko-KR")}개월 동안 정기구독 중
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {subscription.isActive && subscription.status === "active"
              ? `다음 결제일 ${formatKstDateLabel(subscription.endAt)}`
              : subscription.isActive
                ? `구독 종료일 ${formatKstDateLabel(subscription.endAt)}`
                : `${formatKstDateLabel(subscription.startedAt)}부터 ${formatKstDateLabel(
                    subscription.endAt,
                  )}까지 구독`}
          </p>
        </div>
      </div>

      <Button type="button" variant="outline" onClick={onManage} className="w-full sm:w-auto">
        구독 관리
      </Button>
    </article>
  );
}

function UserSubscriptionManagementDialog({
  subscription,
  open,
  onOpenChange,
}: {
  subscription: UserSubscriptionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const badgeMonths = useMemo(
    () => buildLiveSubscriptionBadgeMonths(subscription?.badge.customMonths ?? []),
    [subscription?.badge.customMonths],
  );
  const currentBadgeMonth = resolveLiveSubscriptionBadgeMonth(
    subscription?.totalMonths,
    subscription?.badge.customMonths ?? [],
  );
  const user = useAuthStore((state) => state.user);
  const {
    walletBalance,
    isLoading: isWalletLoading,
    isError: isWalletError,
  } = useUserWalletBalance(user?.id);
  const canSubscribe = subscription
    ? canStartCreatorSubscription({
        isSubscribed: subscription.isActive,
        status: subscription.status,
      })
    : false;
  const shouldCancel = Boolean(subscription?.isActive && subscription.status === "active");
  const isRestartAction = subscription ? isUserSubscriptionRestartAction(subscription) : false;
  const { isPending, handlePrimaryAction } = useUserSubscriptionManagement({
    subscription,
    canSubscribe,
    shouldCancel,
    onOpenChange,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-md">
        {subscription ? (
          <>
            <header className="border-border border-b px-5 py-5">
              <DialogTitle className="sr-only">내 정기구독 관리</DialogTitle>
              <DialogDescription className="sr-only">
                구독 중인 방송인의 구독 혜택과 해지 버튼을 확인합니다.
              </DialogDescription>
              <DialogCreatorSummary subscription={subscription} />
            </header>

            <ScrollArea className="max-h-[calc(100vh-14rem)]">
              <div className="flex flex-col">
                <section className="border-border flex flex-col gap-3 border-b px-5 py-5">
                  <h3 className="text-sm font-black">
                    <span className="text-brand">{subscription.creatorNickname}</span> 구독 혜택
                  </h3>
                  <div className="border-border overflow-hidden rounded-lg border">
                    {SUBSCRIPTION_BENEFITS.map((benefit) => (
                      <div
                        key={benefit.label}
                        className="border-border flex items-center gap-3 border-b px-3 py-3 last:border-b-0"
                      >
                        <benefit.icon className="text-muted-foreground size-4 shrink-0" />
                        <span className="text-sm font-medium">{benefit.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="from-brand/10 to-live/10 border-border/60 text-muted-foreground flex items-center justify-between gap-3 rounded-lg border bg-linear-to-r px-3 py-2.5 text-xs">
                    <span>보유 포인트</span>
                    <strong className="text-foreground font-medium">
                      {isWalletLoading
                        ? "조회 중"
                        : isWalletError
                          ? "조회 실패"
                          : formatPoint(walletBalance)}
                    </strong>
                  </div>
                </section>

                <section className="flex flex-col gap-3 px-5 py-5">
                  <div className="flex items-center gap-2">
                    <Star className="text-brand size-4 fill-current" />
                    <h3 className="text-sm font-black">구독자 전용 배지</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                    {badgeMonths.map((month) => {
                      const isCurrentBadge = month === currentBadgeMonth;

                      return (
                        <div
                          key={month}
                          className={cn(
                            "flex min-w-0 flex-col items-center gap-1.5",
                            isCurrentBadge ? "text-brand" : "text-muted-foreground",
                          )}
                        >
                          <LiveSubscriptionBadge
                            creatorId={subscription.creatorId}
                            totalMonths={month}
                            customMonths={subscription.badge.customMonths}
                            version={subscription.badge.version}
                            imageSourcesByMonth={subscription.badge.imageSourcesByMonth}
                            size="lg"
                          />
                          <span
                            className={cn(
                              "text-xs leading-none whitespace-nowrap",
                              isCurrentBadge ? "font-black" : "font-medium",
                            )}
                          >
                            {month}개월
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </ScrollArea>

            <footer className="border-border mx-0 mb-0 flex flex-col items-stretch gap-3 border-t p-5">
              <p className="text-muted-foreground text-xs leading-5">
                매월 후원 지갑에서 {formatPoint(CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT)}가 사용됩니다.
              </p>
              <Button
                type="button"
                variant={shouldCancel ? "destructive" : "default"}
                className={cn(
                  "h-11 w-full font-black",
                  isRestartAction && "bg-live hover:bg-live/90 text-white",
                )}
                disabled={isPending || (!shouldCancel && !canSubscribe)}
                onClick={handlePrimaryAction}
              >
                <WalletCards className="size-4" />
                {getUserSubscriptionManagementPrimaryActionLabel({
                  isActive: subscription.isActive,
                  status: subscription.status,
                  isPending,
                })}
              </Button>
            </footer>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DialogCreatorSummary({ subscription }: { subscription: UserSubscriptionItem }) {
  const avatarSrc = getAvatarImageSrc(subscription.creatorPhotoUrl);
  const fallbackText = getAvatarFallbackText(subscription.creatorNickname);

  return (
    <section className="flex items-center gap-4">
      <Avatar className="size-16">
        <AvatarImage src={avatarSrc} alt={`${subscription.creatorNickname} 프로필`} />
        <AvatarFallback>{fallbackText}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="truncate text-xl font-black">{subscription.creatorNickname}</h3>
        </div>
      </div>
    </section>
  );
}

function SubscriptionEmptyState({ title }: { title: string }) {
  return (
    <div className="border-border bg-muted/20 flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <Sparkles className="text-muted-foreground size-6" />
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
    </div>
  );
}

function SubscriptionPolicyNotice() {
  return (
    <section className="text-muted-foreground flex flex-col gap-5 text-sm leading-7">
      <div>
        <h2 className="text-foreground mb-2 font-black">채널 구독 청약철회 및 환불 안내</h2>
        <p>본 구독 상품은 구매자가 지정한 채널에 한하여 제공됩니다.</p>
        <p>결제 완료 후 구독 기간이 만료될 때까지 구독 혜택이 제공됩니다.</p>
        <p>결제 연동 이후에는 결제 수단 변경과 구독 해지 정책을 별도로 적용합니다.</p>
      </div>
      <div>
        <h2 className="text-foreground mb-2 font-black">구독 중지 안내</h2>
        <p>구독을 해지해도 이미 결제된 기간이 끝날 때까지 구독 혜택이 유지됩니다.</p>
        <p>해지 예약 중이거나 만료된 구독은 구독 관리에서 다시 시작할 수 있습니다.</p>
      </div>
    </section>
  );
}

function getTabCount(snapshot: UserSubscriptionSnapshot, value: UserSubscriptionTab) {
  if (value === "active") return snapshot.activeSubscriptions.length;

  return snapshot.expiredSubscriptions.length;
}

function getSubscriptionStatusMeta(subscription: UserSubscriptionItem) {
  if (!subscription.isActive) {
    return STATUS_META.ended;
  }

  return STATUS_META[subscription.status];
}

function formatKstDateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}년 ${month}월 ${day}일`;
}

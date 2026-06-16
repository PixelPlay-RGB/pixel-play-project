"use client";
// 사용자 구독 목록과 구독 관리 다이얼로그를 렌더링합니다.

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Sparkles } from "lucide-react";

import { subscribeCreatorAction } from "@/actions/live/live";
import { cancelCreatorSubscriptionAction } from "@/actions/user/subscription";
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { LiveSubscriptionBadge } from "@/components/live/chat/live-subscription-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import { cn } from "@/lib/utils";
import type { CreatorSubscriptionStatus } from "@/types/live/live";
import type {
  UserSubscriptionItem,
  UserSubscriptionSnapshot,
} from "@/types/subscriptions/user-subscriptions";
import { getAppMessage } from "@/utils/common/app-message";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import {
  buildLiveSubscriptionBadgeMonths,
  resolveLiveSubscriptionBadgeMonth,
} from "@/utils/live/live-subscription-badge";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import { canStartCreatorSubscription } from "@/utils/subscriptions/user-subscription-status";

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const badgeMonths = useMemo(
    () => buildLiveSubscriptionBadgeMonths(subscription?.badge.customMonths ?? []),
    [subscription?.badge.customMonths],
  );
  const currentBadgeMonth = resolveLiveSubscriptionBadgeMonth(
    subscription?.totalMonths,
    subscription?.badge.customMonths ?? [],
  );
  const canSubscribe = subscription
    ? canStartCreatorSubscription({
        isSubscribed: subscription.isActive,
        status: subscription.status,
      })
    : false;
  const shouldCancel = Boolean(subscription?.isActive && subscription.status === "active");

  const handleCancel = () => {
    if (!subscription || isPending) return;

    startTransition(async () => {
      const result = await cancelCreatorSubscriptionAction(subscription.id);

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.user.subscriptionCancelFailed);
        return;
      }

      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.user.subscriptionCanceled);
      onOpenChange(false);
      router.refresh();
    });
  };

  const handleSubscribe = () => {
    if (!subscription || isPending || !canSubscribe) return;

    startTransition(async () => {
      const result = await subscribeCreatorAction({ creatorId: subscription.creatorId });

      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.live.subscriptionFailed);
        return;
      }

      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.live.subscribed);
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-md">
        {subscription ? (
          <>
            <DialogHeader className="border-border border-b px-5 py-4 text-center">
              <DialogTitle className="text-lg font-black">내 정기구독 관리</DialogTitle>
              <DialogDescription className="sr-only">
                구독 중인 방송인의 구독 혜택과 해지 버튼을 확인합니다.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(100vh-10rem)]">
              <div className="flex flex-col gap-4 p-5">
                <DialogCreatorSummary subscription={subscription} />

                <DialogInfoPanel
                  icon={<CalendarDays className="size-4" />}
                  label={getDialogDateLabel(subscription)}
                  value={
                    subscription.isActive
                      ? formatKstDateLabel(subscription.endAt)
                      : `${formatKstDateLabel(subscription.startedAt)}부터 ${formatKstDateLabel(
                          subscription.endAt,
                        )}까지`
                  }
                  actionLabel="결제수단 변경"
                  disabled
                />

                <section className="border-border flex flex-col gap-3 rounded-xl border p-4">
                  <h3 className="text-sm font-black">내 구독 배지</h3>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                    {badgeMonths.map((month) => {
                      const isCurrentBadge = month === currentBadgeMonth;

                      return (
                        <div
                          key={month}
                          className={cn(
                            "flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-2 py-2 ring-1 transition-colors",
                            isCurrentBadge ? "bg-brand/10 ring-brand/30" : "ring-transparent",
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-10 items-center justify-center rounded-lg ring-1",
                              isCurrentBadge
                                ? "bg-background/70 ring-brand/20"
                                : "bg-muted/40 ring-border",
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
                          </div>
                          <span
                            className={cn(
                              "text-xs font-medium",
                              isCurrentBadge ? "text-brand font-black" : "text-muted-foreground",
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

            <footer className="border-border border-t p-5">
              <Button
                type="button"
                variant={shouldCancel ? "destructive" : "default"}
                className="h-11 w-full font-black"
                disabled={isPending || (!shouldCancel && !canSubscribe)}
                onClick={shouldCancel ? handleCancel : handleSubscribe}
              >
                {getDialogPrimaryActionLabel(subscription, isPending)}
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
        <p className="text-muted-foreground mt-1 text-base font-black">
          구독기간 {subscription.totalMonths.toLocaleString("ko-KR")}개월
        </p>
      </div>
    </section>
  );
}

function DialogInfoPanel({
  icon,
  label,
  value,
  actionLabel,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  actionLabel: string;
  disabled?: boolean;
}) {
  return (
    <section className="border-border flex flex-col items-center gap-3 rounded-xl border p-4 text-center">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <strong className="text-lg font-black">{value}</strong>
      <Button type="button" variant="secondary" disabled={disabled} className="h-9 w-full">
        {actionLabel}
      </Button>
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

function getDialogDateLabel(subscription: UserSubscriptionItem) {
  if (!subscription.isActive) return "구독 기간";
  if (subscription.status === "canceled") return "구독 종료일";

  return "다음 결제일";
}

function getDialogPrimaryActionLabel(subscription: UserSubscriptionItem, isPending: boolean) {
  if (subscription.isActive && subscription.status === "active") {
    return isPending ? "구독 해지 중" : "구독 해지";
  }

  if (subscription.isActive && subscription.status === "canceled") {
    return isPending ? "구독 재개 중" : "구독 다시 시작";
  }

  return isPending ? "구독 처리 중" : "다시 구독";
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

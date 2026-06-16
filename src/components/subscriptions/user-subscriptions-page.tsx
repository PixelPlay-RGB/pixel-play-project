"use client";
// 사용자 구독 목록과 구독 관리 다이얼로그를 렌더링합니다.

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { BadgeCheck, CalendarDays, CreditCard, Gift, SmilePlus, Sparkles } from "lucide-react";

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

type UserSubscriptionTab = "active" | "expired" | "gift";

interface Props {
  snapshot: UserSubscriptionSnapshot | null;
  errorCode?: AppMessageCode;
}

const PAGE_HEADER = {
  kicker: "SUBSCRIPTIONS",
  title: "내 구독",
  description: "구독 중인 방송인의 배지, 다음 결제일, 구독자 전용 이모티콘을 확인합니다.",
} as const;

const TAB_ITEMS: Array<{ value: UserSubscriptionTab; label: string }> = [
  { value: "active", label: "구독중인 채널" },
  { value: "expired", label: "만료된 구독" },
  { value: "gift", label: "선물 내역" },
];

const STATUS_META: Record<
  CreatorSubscriptionStatus | "ended",
  { label: string; className: string }
> = {
  active: { label: "구독중", className: "bg-brand/15 text-brand" },
  expired: { label: "만료", className: "bg-muted text-muted-foreground" },
  canceled: { label: "해지됨", className: "bg-destructive/10 text-destructive" },
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
    tab === "active"
      ? snapshot.activeSubscriptions
      : tab === "expired"
        ? snapshot.expiredSubscriptions
        : [];

  return (
    <SettingsPage {...PAGE_HEADER}>
      <SubscriptionGiftBanner />

      <SettingsCard contentClassName="gap-6">
        <Tabs value={tab} onValueChange={(value) => setTab(value as UserSubscriptionTab)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-fit">
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

function SubscriptionGiftBanner() {
  return (
    <section className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="bg-brand/10 text-brand flex size-12 shrink-0 items-center justify-center rounded-xl">
          <Gift className="size-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-foreground text-base font-black">
            좋아하는 스트리머의 구독권을 선물해 보세요.
          </h2>
          <p className="text-brand mt-1 text-sm font-bold">내 마음이 더 소중하게 전달됩니다.</p>
        </div>
      </div>
      <Button type="button" variant="secondary" disabled className="w-full sm:w-auto">
        선물하기 준비 중
      </Button>
    </section>
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
  if (tab === "gift") {
    return <SubscriptionEmptyState title="아직 선물 내역이 없습니다." />;
  }

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
            <BadgeCheck className="text-brand size-4 shrink-0 fill-current" />
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
            {subscription.isActive
              ? `다음 결제일 ${formatKstDateLabel(subscription.endAt)}`
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
                  label="다음 결제일"
                  value={
                    subscription.isActive
                      ? formatKstDateLabel(subscription.endAt)
                      : "구독이 종료되었습니다."
                  }
                  actionLabel="결제수단 변경"
                  disabled
                />

                <DialogInfoPanel
                  icon={<CreditCard className="size-4" />}
                  label="현재 구독 티어"
                  value="기본 구독"
                  actionLabel="티어 변경"
                  disabled
                />

                <section className="border-border flex flex-col gap-3 rounded-xl border p-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="text-brand size-4" />
                    <h3 className="text-sm font-black">내 구독 배지</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                    {badgeMonths.map((month) => (
                      <div key={month} className="flex min-w-0 flex-col items-center gap-1.5">
                        <div
                          className={cn(
                            "flex size-10 items-center justify-center rounded-lg ring-1",
                            month === currentBadgeMonth
                              ? "bg-brand/10 ring-brand/30"
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
                        <span className="text-muted-foreground text-xs font-medium">
                          {month}개월
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="border-border flex flex-col gap-3 rounded-xl border p-4">
                  <div className="flex items-center gap-2">
                    <SmilePlus className="text-brand size-4" />
                    <h3 className="text-sm font-black">구독자 전용 이모티콘</h3>
                  </div>
                  {subscription.emotes.length > 0 ? (
                    <div className="grid grid-cols-5 gap-3 sm:grid-cols-6">
                      {subscription.emotes.map((emote) => (
                        <div
                          key={emote.src}
                          className="border-border bg-muted/30 flex aspect-square items-center justify-center overflow-hidden rounded-lg border"
                          title={emote.name}
                        >
                          <Image
                            src={emote.src}
                            alt={emote.name}
                            width={40}
                            height={40}
                            className="size-8 object-contain"
                            unoptimized={emote.src.toLowerCase().includes(".gif")}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-muted/30 text-muted-foreground rounded-lg px-3 py-5 text-center text-sm">
                      등록된 구독자 전용 이모티콘이 없습니다.
                    </div>
                  )}
                </section>
              </div>
            </ScrollArea>

            <footer className="border-border border-t p-5">
              <Button
                type="button"
                variant="destructive"
                className="h-11 w-full font-black"
                disabled={!subscription.isActive || isPending}
                onClick={handleCancel}
              >
                {isPending ? "구독 해지 중" : subscription.isActive ? "구독 해지" : "종료된 구독"}
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
          <BadgeCheck className="text-brand size-4 shrink-0 fill-current" />
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
        <p>구독 해지 상태에서는 구독 혜택이 제공되지 않습니다.</p>
        <p>구독을 다시 시작하면 누적 구독 기간을 기준으로 배지가 표시됩니다.</p>
      </div>
    </section>
  );
}

function getTabCount(snapshot: UserSubscriptionSnapshot, value: UserSubscriptionTab) {
  if (value === "active") return snapshot.activeSubscriptions.length;
  if (value === "expired") return snapshot.expiredSubscriptions.length;
  return 0;
}

function getSubscriptionStatusMeta(subscription: UserSubscriptionItem) {
  if (!subscription.isActive && subscription.status === "active") {
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

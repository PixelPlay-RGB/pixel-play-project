"use client";
// 채널 구독 퍼스나콘과 시그니처 이모티콘 설정 섹션을 렌더링합니다.

import { CircleHelp, Plus } from "lucide-react";
import { useState } from "react";

import { PersonaconRegistrationDialog } from "@/components/channel/subscription/channel-subscription-personacon-dialog";
import { SignatureEmoteRegistrationDialog } from "@/components/channel/subscription/channel-subscription-emote-dialog";
import { LiveSubscriptionBadge } from "@/components/live/chat/live-subscription-badge";
import { Button } from "@/components/ui/button";
import { CHANNEL_SUBSCRIPTION_EMOTE_LIMIT } from "@/utils/channel/channel-subscription-emote-upload";

interface Props {
  creatorId: string;
  customMonths: number[];
  subscriptionEmoteCommonCount: number;
  subscriptionEmotePlusCount: number;
}

export function ChannelSubscriptionPerkSettings({
  creatorId,
  customMonths,
  subscriptionEmoteCommonCount,
  subscriptionEmotePlusCount,
}: Props) {
  const [personaconDialogOpen, setPersonaconDialogOpen] = useState(false);
  const [emoteDialogOpen, setEmoteDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <SubscriptionAssetSectionHeader
          title="퍼스나콘"
          actionLabel="등록하기"
          onAction={() => setPersonaconDialogOpen(true)}
        />

        <div className="bg-card min-h-48 rounded-xl p-5 shadow-sm ring-1 ring-black/5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-foreground text-base font-black">사용중인 퍼스나콘</h3>
            <div
              className="border-border bg-background flex overflow-hidden rounded-lg border text-xs font-bold"
              aria-label="퍼스나콘 구독 구분"
            >
              <span className="border-primary/40 text-primary bg-primary/5 border-r px-3 py-2">
                베이직
              </span>
              <span className="text-muted-foreground px-3 py-2">플러스</span>
            </div>
          </div>

          <div className="mt-8 flex w-fit flex-col items-center gap-2 px-4">
            <LiveSubscriptionBadge
              creatorId={creatorId}
              totalMonths={1}
              customMonths={customMonths}
              size="lg"
            />
            <div className="text-center leading-5">
              <p className="text-foreground text-sm font-bold">기본</p>
              <p className="text-muted-foreground text-xs">(1개월)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SubscriptionAssetSectionHeader
          title="시그니처 이모티콘"
          actionLabel="등록하기"
          onAction={() => setEmoteDialogOpen(true)}
        />

        <div className="bg-card flex min-h-66 flex-col rounded-xl p-5 shadow-sm ring-1 ring-black/5 sm:p-7">
          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <SubscriptionEmoteCount
                label="공통"
                count={subscriptionEmoteCommonCount}
                detail="일반 이모티콘 0개 · 움직이는 이모티콘 0개"
              />
              <SubscriptionEmoteCount
                label="플러스"
                count={subscriptionEmotePlusCount}
                detail="일반 이모티콘 0개 · 움직이는 이모티콘 0개"
              />
            </div>
            <Button type="button" variant="ghost" size="sm" className="self-start text-xs">
              개수 정책 보기
              <span aria-hidden>›</span>
            </Button>
          </div>

          {subscriptionEmoteCommonCount + subscriptionEmotePlusCount === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <p className="text-foreground text-sm font-black">
                등록된 시그니처 이모티콘이 없어요.
              </p>
              <p className="text-muted-foreground mt-2 text-sm">등록 후 사용해 주세요!</p>
            </div>
          ) : (
            <div className="text-muted-foreground flex flex-1 items-center justify-center py-12 text-center text-sm">
              등록된 이모티콘은 구독 팝오버와 채팅 입력 영역에서 사용할 수 있어요.
            </div>
          )}
        </div>
      </section>

      <PersonaconRegistrationDialog
        open={personaconDialogOpen}
        onOpenChange={setPersonaconDialogOpen}
      />
      <SignatureEmoteRegistrationDialog open={emoteDialogOpen} onOpenChange={setEmoteDialogOpen} />
    </div>
  );
}

function SubscriptionAssetSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5">
        <h2 className="text-foreground text-xl font-black">{title}</h2>
        {title === "퍼스나콘" ? (
          <CircleHelp className="text-muted-foreground size-4" aria-hidden />
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-primary hover:text-primary"
        onClick={onAction}
      >
        <Plus className="size-4" />
        {actionLabel}
      </Button>
    </div>
  );
}

function SubscriptionEmoteCount({
  label,
  count,
  detail,
}: {
  label: string;
  count: number;
  detail: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <strong className="text-foreground whitespace-nowrap">
        {label} 총 {count}/{CHANNEL_SUBSCRIPTION_EMOTE_LIMIT}개
      </strong>
      <span className="text-muted-foreground min-w-0 truncate text-xs">({detail})</span>
      <CircleHelp className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
    </span>
  );
}

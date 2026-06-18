"use client";
// 방송 운영 화면의 채팅, 후원, 알림 빠른 설정을 오른쪽 패널로 렌더링합니다.

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChannelLiveDonationFeedPanel } from "@/components/channel/live/channel-live-donation-feed-panel";
import { SettingNumberSelectControl } from "@/components/common/setting-number-select-control";
import { SettingToggleControl } from "@/components/common/setting-toggle-control";
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  CHANNEL_CHAT_SCOPE_OPTIONS,
  CHANNEL_CHAT_SLOW_MODE_OPTIONS,
} from "@/constants/channel/chat";
import { cn } from "@/lib/utils";
import type { ChannelLiveRecentDonation } from "@/actions/channel/live";
import type { LiveChatScope } from "@/types/channel/chat";
import { Save } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  broadcastId: string | null;
  canSaveSettings: boolean;
  chatScope: LiveChatScope;
  initialDonations: ChannelLiveRecentDonation[];
  isAlertSoundEnabled: boolean;
  isDonationAmountVisible: boolean;
  isDonationEnabled: boolean;
  isLinkBlocked: boolean;
  isSettingsActionPending: boolean;
  isSlowModeEnabled: boolean;
  isTtsEnabled: boolean;
  slowModeSeconds: number;
  onAlertSoundEnabledChange: (isAlertSoundEnabled: boolean) => void;
  onChatScopeChange: (chatScope: LiveChatScope) => void;
  onDonationAmountVisibleChange: (isDonationAmountVisible: boolean) => void;
  onDonationEnabledChange: (isDonationEnabled: boolean) => void;
  onLinkBlockedChange: (isLinkBlocked: boolean) => void;
  onSaveSettings: () => void;
  onSlowModeEnabledChange: (isSlowModeEnabled: boolean) => void;
  onSlowModeSecondsChange: (slowModeSeconds: number) => void;
  onTtsEnabledChange: (isTtsEnabled: boolean) => void;
}

function QuickSettingSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-foreground px-1 text-sm font-bold">{title}</h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function QuickSettingRow({
  children,
  isDimmed,
  label,
}: {
  children: ReactNode;
  isDimmed?: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-9 items-center justify-between gap-2 px-1",
        isDimmed && "opacity-60",
      )}
    >
      <span className="text-foreground min-w-0 truncate text-xs font-semibold">{label}</span>
      <div className="flex shrink-0 items-center justify-end gap-2">{children}</div>
    </div>
  );
}

export default function ChannelLiveQuickSettingsPanel({
  broadcastId,
  canSaveSettings,
  chatScope,
  initialDonations,
  isAlertSoundEnabled,
  isDonationAmountVisible,
  isDonationEnabled,
  isLinkBlocked,
  isSettingsActionPending,
  isSlowModeEnabled,
  isTtsEnabled,
  slowModeSeconds,
  onAlertSoundEnabledChange,
  onChatScopeChange,
  onDonationAmountVisibleChange,
  onDonationEnabledChange,
  onLinkBlockedChange,
  onSaveSettings,
  onSlowModeEnabledChange,
  onSlowModeSecondsChange,
  onTtsEnabledChange,
}: Props) {
  return (
    <div className="flex min-h-full flex-col">
      {/* 풀블리드 우측 칼럼 — 카드 대신 면으로 채우고 헤더는 다른 칼럼 헤더와 같은 보더로 구분한다. */}
      <Card className="flex shrink-0 flex-col gap-5 rounded-none border-0 py-0 pb-4 shadow-none">
        {/* 채팅 패널 헤더와 같은 높이(--app-header-height, 보더 포함)로 고정해 separator 라인을 맞춘다.
            기본 grid는 CardAction(row-span-2)이 빈 행+row gap을 만들어 수직 중앙이 어긋나므로 flex로 단순화한다. */}
        {/* 기본 [.border-b]:pb-4가 py-0보다 우선해 아래 패딩이 남으므로 같은 변형으로 0을 덮는다. */}
        <CardHeader className="border-border flex h-[var(--app-header-height)] items-center justify-between gap-2 border-b px-4 py-0 [.border-b]:pb-0">
          <CardTitle>빠른 설정</CardTitle>
          {/* CardAction 기본 self-start가 flex에서도 위로 붙이므로 중앙으로 덮는다. */}
          <CardAction className="self-center">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSettingsActionPending || !canSaveSettings}
              onClick={onSaveSettings}
            >
              <Save className="size-4" />
              저장
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-4">
          <QuickSettingSection title="채팅">
            <QuickSettingRow label="채팅 범위">
              <Select
                value={chatScope}
                items={CHANNEL_CHAT_SCOPE_OPTIONS}
                disabled={isSettingsActionPending}
                onValueChange={(value) => onChatScopeChange(value as LiveChatScope)}
              >
                <SelectTrigger aria-label="채팅 범위" className="w-28">
                  <SelectValue />
                  <SelectIcon />
                </SelectTrigger>
                <SelectContent>
                  <SelectList>
                    {CHANNEL_CHAT_SCOPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} label={option.label}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectContent>
              </Select>
            </QuickSettingRow>
            <QuickSettingRow label="저속 모드">
              <SettingNumberSelectControl
                ariaLabel="저속 모드 채팅 간격"
                value={slowModeSeconds}
                options={CHANNEL_CHAT_SLOW_MODE_OPTIONS}
                disabled={isSettingsActionPending || !isSlowModeEnabled}
                compact
                onChange={onSlowModeSecondsChange}
              />
              <SettingToggleControl
                checked={isSlowModeEnabled}
                checkedLabel="ON"
                uncheckedLabel="OFF"
                ariaLabel="저속 모드 사용"
                disabled={isSettingsActionPending}
                onChange={onSlowModeEnabledChange}
              />
            </QuickSettingRow>
            <QuickSettingRow label="링크 차단">
              <SettingToggleControl
                checked={isLinkBlocked}
                checkedLabel="ON"
                uncheckedLabel="OFF"
                ariaLabel="링크 차단"
                disabled={isSettingsActionPending}
                onChange={onLinkBlockedChange}
              />
            </QuickSettingRow>
          </QuickSettingSection>

          <Separator />

          <QuickSettingSection title="후원">
            <QuickSettingRow label="후원 받기">
              <SettingToggleControl
                checked={isDonationEnabled}
                checkedLabel="ON"
                uncheckedLabel="OFF"
                ariaLabel="후원 받기"
                disabled={isSettingsActionPending}
                onChange={onDonationEnabledChange}
              />
            </QuickSettingRow>
            <QuickSettingRow label="후원 금액 공개">
              <SettingToggleControl
                checked={isDonationAmountVisible}
                checkedLabel="ON"
                uncheckedLabel="OFF"
                ariaLabel="후원 금액 공개"
                disabled={isSettingsActionPending}
                onChange={onDonationAmountVisibleChange}
              />
            </QuickSettingRow>
          </QuickSettingSection>

          <Separator />

          <QuickSettingSection title="알림">
            <QuickSettingRow label="알림 사운드">
              <SettingToggleControl
                checked={isAlertSoundEnabled}
                checkedLabel="ON"
                uncheckedLabel="OFF"
                ariaLabel="알림 사운드"
                disabled={isSettingsActionPending}
                onChange={onAlertSoundEnabledChange}
              />
            </QuickSettingRow>
            <QuickSettingRow label="TTS 사용">
              <SettingToggleControl
                checked={isTtsEnabled}
                checkedLabel="ON"
                uncheckedLabel="OFF"
                ariaLabel="TTS 사용"
                disabled={isSettingsActionPending}
                onChange={onTtsEnabledChange}
              />
            </QuickSettingRow>
          </QuickSettingSection>
        </CardContent>
      </Card>

      <Separator />

      <ChannelLiveDonationFeedPanel
        key={broadcastId ?? "offline"}
        broadcastId={broadcastId}
        initialDonations={initialDonations}
      />
    </div>
  );
}

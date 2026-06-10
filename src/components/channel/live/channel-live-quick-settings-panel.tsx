"use client";
// 방송 운영 화면의 채팅, 후원, 알림 빠른 설정을 오른쪽 패널로 렌더링합니다.

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingNumberSelectControl } from "@/components/common/setting-number-select-control";
import { CHANNEL_CHAT_SLOW_MODE_OPTIONS } from "@/constants/channel/chat";
import { cn } from "@/lib/utils";
import { HandCoins, Link2, MessageCircle, Mic2, Save, Timer, Volume2 } from "lucide-react";
import type { ComponentType } from "react";

interface Props {
  canSaveSettings: boolean;
  isAlertSoundEnabled: boolean;
  isChatDonationMessageEnabled: boolean;
  isDonationAmountVisible: boolean;
  isDonationEnabled: boolean;
  isLinkBlocked: boolean;
  isSettingsActionPending: boolean;
  isSlowModeEnabled: boolean;
  isTtsEnabled: boolean;
  slowModeSeconds: number;
  onAlertSoundEnabledChange: (isAlertSoundEnabled: boolean) => void;
  onChatDonationMessageEnabledChange: (isChatDonationMessageEnabled: boolean) => void;
  onDonationAmountVisibleChange: (isDonationAmountVisible: boolean) => void;
  onDonationEnabledChange: (isDonationEnabled: boolean) => void;
  onLinkBlockedChange: (isLinkBlocked: boolean) => void;
  onSaveSettings: () => void;
  onSlowModeEnabledChange: (isSlowModeEnabled: boolean) => void;
  onSlowModeSecondsChange: (slowModeSeconds: number) => void;
  onTtsEnabledChange: (isTtsEnabled: boolean) => void;
}

interface QuickSettingRowProps {
  checked: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onChange: (checked: boolean) => void;
}

function QuickSettingSectionTitle({ title }: { title: string }) {
  return (
    <div className="text-muted-foreground flex shrink-0 items-center gap-2 px-1 text-xs font-bold">
      <span className="border-border w-3 shrink-0 border-t" />
      <h3 className="shrink-0">{title}</h3>
      <span className="border-border min-w-0 flex-1 border-t" />
    </div>
  );
}

function QuickSettingRow({ checked, icon: Icon, label, onChange }: QuickSettingRowProps) {
  return (
    <button
      type="button"
      className={cn(
        "text-muted-foreground flex min-h-12 items-center justify-between gap-3 rounded-xl px-1 py-2 text-left text-sm font-bold transition-colors",
        "hover:text-foreground",
      )}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "bg-muted/60 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
            checked && "text-brand",
          )}
        >
          <Icon className="size-4" />
        </span>
        <span>{label}</span>
      </span>
      <span
        className={cn(
          "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-brand" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}

function QuickSettingSlowModeRow({
  checked,
  seconds,
  onChange,
  onSecondsChange,
}: {
  checked: boolean;
  seconds: number;
  onChange: (checked: boolean) => void;
  onSecondsChange: (seconds: number) => void;
}) {
  return (
    <div className="text-muted-foreground flex min-h-12 flex-col gap-2 rounded-xl px-1 py-2 text-sm font-bold sm:flex-row sm:items-center sm:justify-between">
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "bg-muted/60 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
            checked && "text-brand",
          )}
        >
          <Timer className="size-4" />
        </span>
        <span>저속모드</span>
      </span>
      <div className="flex items-center justify-end gap-2">
        <SettingNumberSelectControl
          ariaLabel="저속모드 채팅 간격"
          value={seconds}
          options={CHANNEL_CHAT_SLOW_MODE_OPTIONS}
          disabled={!checked}
          compact
          onChange={onSecondsChange}
        />
        <button
          type="button"
          className="shrink-0 rounded-full"
          aria-label="저속모드 사용"
          aria-pressed={checked}
          onClick={() => onChange(!checked)}
        >
          <span
            className={cn(
              "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
              checked ? "bg-brand" : "bg-muted-foreground/30",
            )}
          >
            <span
              className={cn(
                "size-4 rounded-full bg-white shadow-sm transition-transform",
                checked && "translate-x-4",
              )}
            />
          </span>
        </button>
      </div>
    </div>
  );
}

export default function ChannelLiveQuickSettingsPanel({
  canSaveSettings,
  isAlertSoundEnabled,
  isChatDonationMessageEnabled,
  isDonationAmountVisible,
  isDonationEnabled,
  isLinkBlocked,
  isSettingsActionPending,
  isSlowModeEnabled,
  isTtsEnabled,
  slowModeSeconds,
  onAlertSoundEnabledChange,
  onChatDonationMessageEnabledChange,
  onDonationAmountVisibleChange,
  onDonationEnabledChange,
  onLinkBlockedChange,
  onSaveSettings,
  onSlowModeEnabledChange,
  onSlowModeSecondsChange,
  onTtsEnabledChange,
}: Props) {
  return (
    // 풀블리드 우측 칼럼 — 카드 대신 면으로 채우고 헤더는 다른 칼럼 헤더와 같은 보더로 구분한다.
    <Card className="flex min-h-144 flex-col gap-5 rounded-none border-0 py-0 pb-6 shadow-none xl:min-h-full">
      <CardHeader className="border-border gap-2 border-b px-4 [.border-b]:pt-3 [.border-b]:pb-3">
        <CardTitle>빠른 설정</CardTitle>
        <CardAction>
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
      <CardContent className="flex flex-1 flex-col justify-between gap-4 px-4">
        <QuickSettingSectionTitle title="채팅" />
        <QuickSettingSlowModeRow
          checked={isSlowModeEnabled}
          onChange={onSlowModeEnabledChange}
          seconds={slowModeSeconds}
          onSecondsChange={onSlowModeSecondsChange}
        />
        <QuickSettingRow
          checked={isLinkBlocked}
          icon={Link2}
          label="링크 차단"
          onChange={onLinkBlockedChange}
        />

        <QuickSettingSectionTitle title="후원" />
        <QuickSettingRow
          checked={isDonationEnabled}
          icon={HandCoins}
          label="후원 받기"
          onChange={onDonationEnabledChange}
        />
        <QuickSettingRow
          checked={isDonationAmountVisible}
          icon={HandCoins}
          label="후원 금액 공개"
          onChange={onDonationAmountVisibleChange}
        />
        <QuickSettingRow
          checked={isChatDonationMessageEnabled}
          icon={MessageCircle}
          label="후원 채팅 표시"
          onChange={onChatDonationMessageEnabledChange}
        />

        <QuickSettingSectionTitle title="알림" />
        <QuickSettingRow
          checked={isAlertSoundEnabled}
          icon={Volume2}
          label="알림 사운드"
          onChange={onAlertSoundEnabledChange}
        />
        <QuickSettingRow
          checked={isTtsEnabled}
          icon={Mic2}
          label="TTS 사용"
          onChange={onTtsEnabledChange}
        />
      </CardContent>
    </Card>
  );
}

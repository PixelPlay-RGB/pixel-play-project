"use client";
// 방송 운영 화면의 채팅, 후원, 알림 빠른 설정을 오른쪽 패널로 렌더링합니다.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Bell, HandCoins, Link2, Mic2, Timer, Volume2 } from "lucide-react";
import type { ComponentType } from "react";

interface Props {
  isAlertSoundEnabled: boolean;
  isDonationAlertEnabled: boolean;
  isDonationAmountVisible: boolean;
  isDonationEnabled: boolean;
  isLinkBlocked: boolean;
  isSlowModeEnabled: boolean;
  isTtsEnabled: boolean;
  onAlertSoundEnabledChange: (isAlertSoundEnabled: boolean) => void;
  onDonationAlertEnabledChange: (isDonationAlertEnabled: boolean) => void;
  onDonationAmountVisibleChange: (isDonationAmountVisible: boolean) => void;
  onDonationEnabledChange: (isDonationEnabled: boolean) => void;
  onLinkBlockedChange: (isLinkBlocked: boolean) => void;
  onSlowModeEnabledChange: (isSlowModeEnabled: boolean) => void;
  onTtsEnabledChange: (isTtsEnabled: boolean) => void;
}

interface QuickSettingRowProps {
  accent?: "brand" | "live";
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

function QuickSettingRow({
  accent = "brand",
  checked,
  icon: Icon,
  label,
  onChange,
}: QuickSettingRowProps) {
  const activeIconClassName = accent === "live" ? "text-live" : "text-brand";
  const activeToggleClassName = accent === "live" ? "bg-live" : "bg-brand";

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
            checked && activeIconClassName,
          )}
        >
          <Icon className="size-4" />
        </span>
        <span>{label}</span>
      </span>
      <span
        className={cn(
          "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? activeToggleClassName : "bg-muted-foreground/30",
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

export default function ChannelLiveQuickSettingsPanel({
  isAlertSoundEnabled,
  isDonationAlertEnabled,
  isDonationAmountVisible,
  isDonationEnabled,
  isLinkBlocked,
  isSlowModeEnabled,
  isTtsEnabled,
  onAlertSoundEnabledChange,
  onDonationAlertEnabledChange,
  onDonationAmountVisibleChange,
  onDonationEnabledChange,
  onLinkBlockedChange,
  onSlowModeEnabledChange,
  onTtsEnabledChange,
}: Props) {
  return (
    <Card className="flex min-h-144 flex-col gap-5 py-6 shadow-sm xl:min-h-full">
      <CardHeader className="gap-2 px-5 sm:px-6">
        <CardTitle>빠른 설정</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4 px-5 sm:px-6">
        <QuickSettingSectionTitle title="채팅" />
        <QuickSettingRow
          checked={isSlowModeEnabled}
          icon={Timer}
          label="저속모드"
          onChange={onSlowModeEnabledChange}
        />
        <QuickSettingRow
          checked={isLinkBlocked}
          icon={Link2}
          label="링크 차단"
          onChange={onLinkBlockedChange}
        />

        <QuickSettingSectionTitle title="후원" />
        <QuickSettingRow
          accent="live"
          checked={isDonationEnabled}
          icon={HandCoins}
          label="후원 받기"
          onChange={onDonationEnabledChange}
        />
        <QuickSettingRow
          accent="live"
          checked={isDonationAmountVisible}
          icon={HandCoins}
          label="후원 금액 공개"
          onChange={onDonationAmountVisibleChange}
        />
        <QuickSettingRow
          accent="live"
          checked={isDonationAlertEnabled}
          icon={Bell}
          label="후원 알림"
          onChange={onDonationAlertEnabledChange}
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

"use client";
// 방송 운영 화면의 채팅, 후원, 알림 빠른 설정을 오른쪽 패널로 렌더링합니다.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Bell, HandCoins, Link2, Mic2, Timer, Volume2 } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

interface Props {
  isAlertSoundEnabled: boolean;
  isDonationAlertEnabled: boolean;
  isDonationAmountVisible: boolean;
  isDonationEnabled: boolean;
  isLinkBlocked: boolean;
  isSlowModeEnabled: boolean;
  isTtsEnabled: boolean;
  streamStatusPanel: ReactNode;
  onAlertSoundEnabledChange: (isAlertSoundEnabled: boolean) => void;
  onDonationAlertEnabledChange: (isDonationAlertEnabled: boolean) => void;
  onDonationAmountVisibleChange: (isDonationAmountVisible: boolean) => void;
  onDonationEnabledChange: (isDonationEnabled: boolean) => void;
  onLinkBlockedChange: (isLinkBlocked: boolean) => void;
  onSlowModeEnabledChange: (isSlowModeEnabled: boolean) => void;
  onTtsEnabledChange: (isTtsEnabled: boolean) => void;
}

interface QuickSettingRowProps {
  checked: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onChange: (checked: boolean) => void;
}

interface QuickSettingSectionProps {
  children: ReactNode;
  title: string;
}

function QuickSettingSection({ children, title }: QuickSettingSectionProps) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-muted-foreground px-1 text-xs font-bold">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function QuickSettingRow({ checked, icon: Icon, label, onChange }: QuickSettingRowProps) {
  return (
    <button
      type="button"
      className={cn(
        "border-border bg-muted/40 text-muted-foreground flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm font-bold shadow-sm transition-colors",
        "hover:border-brand/40 hover:bg-brand/5",
        checked && "border-brand/40 bg-brand/10 text-brand",
      )}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "bg-background flex size-8 shrink-0 items-center justify-center rounded-full",
            checked ? "text-brand" : "text-muted-foreground",
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

export default function ChannelLiveQuickSettingsPanel({
  isAlertSoundEnabled,
  isDonationAlertEnabled,
  isDonationAmountVisible,
  isDonationEnabled,
  isLinkBlocked,
  isSlowModeEnabled,
  isTtsEnabled,
  streamStatusPanel,
  onAlertSoundEnabledChange,
  onDonationAlertEnabledChange,
  onDonationAmountVisibleChange,
  onDonationEnabledChange,
  onLinkBlockedChange,
  onSlowModeEnabledChange,
  onTtsEnabledChange,
}: Props) {
  return (
    <Card className="flex min-h-144 flex-col gap-5 py-6 shadow-sm xl:sticky xl:top-0 xl:h-[calc(100vh-6rem)] xl:min-h-0">
      <CardHeader className="gap-2 px-5 sm:px-6">
        <CardTitle>빠른 설정</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5 px-5 sm:px-6">
        <QuickSettingSection title="채팅">
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
        </QuickSettingSection>

        <QuickSettingSection title="후원">
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
            checked={isDonationAlertEnabled}
            icon={Bell}
            label="후원 알림"
            onChange={onDonationAlertEnabledChange}
          />
        </QuickSettingSection>

        <QuickSettingSection title="알림">
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
        </QuickSettingSection>

        <div className="mt-auto">{streamStatusPanel}</div>
      </CardContent>
    </Card>
  );
}

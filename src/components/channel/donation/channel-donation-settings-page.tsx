"use client";
// 크리에이터의 후원과 후원 알림 설정을 관리하는 채널 설정 페이지입니다.

import {
  updateChannelLiveSettingsAction,
  type ChannelLiveStudioSettings,
  type ChannelLiveStudioSnapshot,
} from "@/actions/channel/live";
import ChannelSettingToggle from "@/components/channel/channel-setting-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CHANNEL_STUDIO_SETTINGS_FALLBACK,
  createStudioSettingsInput,
  DONATION_ALERT_DURATION_OPTIONS,
  formatSecondsLabel,
  formatWon,
  TTS_RATE_OPTIONS,
} from "@/utils/channel/channel-studio-setting";
import { Bell, HandCoins, Mic2, Save, Volume2 } from "lucide-react";
import { useState, useTransition } from "react";

interface Props {
  initialSnapshot?: ChannelLiveStudioSnapshot;
}

function getInitialSettings(snapshot?: ChannelLiveStudioSnapshot): ChannelLiveStudioSettings {
  return snapshot?.settings ?? CHANNEL_STUDIO_SETTINGS_FALLBACK;
}

function toNumber(value: string, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function ChannelDonationSettingsPage({ initialSnapshot }: Props) {
  const initialSettings = getInitialSettings(initialSnapshot);
  const [settings, setSettings] = useState(initialSettings);
  const [donationEnabled, setDonationEnabled] = useState(initialSettings.donationEnabled);
  const [donationAmountVisible, setDonationAmountVisible] = useState(
    initialSettings.donationAmountVisible,
  );
  const [donationAlertEnabled, setDonationAlertEnabled] = useState(
    initialSettings.donationAlertEnabled,
  );
  const [donationMinAmount, setDonationMinAmount] = useState(initialSettings.donationMinAmount);
  const [donationAlertDurationSeconds, setDonationAlertDurationSeconds] = useState(
    initialSettings.donationAlertDurationSeconds,
  );
  const [alertSoundEnabled, setAlertSoundEnabled] = useState(initialSettings.alertSoundEnabled);
  const [alertVolume, setAlertVolume] = useState(initialSettings.alertVolume);
  const [ttsEnabled, setTtsEnabled] = useState(initialSettings.ttsEnabled);
  const [ttsRate, setTtsRate] = useState(initialSettings.ttsRate);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setActionMessage(null);
    startTransition(async () => {
      const result = await updateChannelLiveSettingsAction(
        createStudioSettingsInput(settings, {
          alertSoundEnabled,
          alertVolume,
          donationAlertDurationSeconds,
          donationAlertEnabled,
          donationAmountVisible,
          donationEnabled,
          donationMinAmount,
          ttsEnabled,
          ttsRate,
        }),
      );

      if (!result.success || !result.data) {
        setActionMessage("후원 설정을 저장하지 못했습니다.");
        return;
      }

      setSettings(result.data.settings);
      setActionMessage("후원 설정을 저장했습니다.");
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">도네이션 설정</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          후원 수신, 알림, TTS 동작을 설정합니다.
        </p>
      </div>

      {actionMessage && (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-xs font-semibold",
            actionMessage.includes("못했습니다")
              ? "border-destructive/20 bg-destructive/10 text-destructive"
              : "border-brand/20 bg-brand/10 text-brand",
          )}
        >
          {actionMessage}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>후원 기본 설정</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ChannelSettingToggle
              checked={donationEnabled}
              description="시청자가 라이브 중 후원을 보낼 수 있습니다."
              icon={HandCoins}
              label="후원 받기"
              onChange={setDonationEnabled}
            />
            <ChannelSettingToggle
              checked={donationAmountVisible}
              description="채팅과 알림에 후원 금액을 표시합니다."
              icon={HandCoins}
              label="후원 금액 공개"
              onChange={setDonationAmountVisible}
            />
            <div className="grid gap-2">
              <Label htmlFor="channel-donation-min-amount">최소 후원 금액</Label>
              <Input
                id="channel-donation-min-amount"
                type="number"
                min={1000}
                max={1000000}
                step={1000}
                value={donationMinAmount}
                onChange={(event) => setDonationMinAmount(toNumber(event.target.value, 1000))}
              />
              <span className="text-muted-foreground text-xs">
                현재 최소 금액은 {formatWon(donationMinAmount)}입니다.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>후원 알림</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ChannelSettingToggle
              checked={donationAlertEnabled}
              description="후원 발생 시 방송 화면에 알림을 표시합니다."
              icon={Bell}
              label="후원 알림"
              onChange={setDonationAlertEnabled}
            />
            <ChannelSettingToggle
              checked={alertSoundEnabled}
              description="후원 알림 사운드를 재생합니다."
              icon={Volume2}
              label="알림 사운드"
              onChange={setAlertSoundEnabled}
            />
            <div className="grid gap-2">
              <Label htmlFor="channel-donation-alert-volume">알림 볼륨</Label>
              <Input
                id="channel-donation-alert-volume"
                type="number"
                min={0}
                max={100}
                value={alertVolume}
                onChange={(event) => setAlertVolume(toNumber(event.target.value, 32))}
              />
            </div>
            <div className="grid gap-2">
              <Label>알림 표시 시간</Label>
              <div className="flex flex-wrap gap-1">
                {DONATION_ALERT_DURATION_OPTIONS.map((seconds) => (
                  <Button
                    key={seconds}
                    type="button"
                    size="sm"
                    variant={donationAlertDurationSeconds === seconds ? "default" : "outline"}
                    onClick={() => setDonationAlertDurationSeconds(seconds)}
                  >
                    {formatSecondsLabel(seconds)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>TTS 설정</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <ChannelSettingToggle
              checked={ttsEnabled}
              description="후원 메시지를 음성으로 읽습니다."
              icon={Mic2}
              label="TTS 사용"
              onChange={setTtsEnabled}
            />
            <div className="grid content-start gap-2">
              <Label>TTS 속도</Label>
              <div className="flex flex-wrap gap-1">
                {TTS_RATE_OPTIONS.map((rate) => (
                  <Button
                    key={rate}
                    type="button"
                    size="sm"
                    variant={ttsRate === rate ? "default" : "outline"}
                    onClick={() => setTtsRate(rate)}
                  >
                    {rate.toFixed(2)}x
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          <Save className="size-4" />
          설정 저장
        </Button>
      </div>
    </div>
  );
}

"use client";
// 채널의 OBS 송출 주소와 스트림 보안 정보를 보여주는 설정 페이지입니다.

import type { ChannelLiveStudioSnapshot } from "@/actions/channel/live";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  CHANNEL_LIVE_MEDIA_CONFIG,
  getChannelLiveHlsUrl,
} from "@/constants/channel/channel-live-media";
import { Copy, KeyRound, RadioTower, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface Props {
  initialSnapshot?: ChannelLiveStudioSnapshot;
}

const OBS_SERVER_URL = CHANNEL_LIVE_MEDIA_CONFIG.rtmpServerUrl;
const STREAM_PATH = CHANNEL_LIVE_MEDIA_CONFIG.streamPath;
const OBS_PUBLISH_URL = `${OBS_SERVER_URL}/${STREAM_PATH}`;
const HLS_PREVIEW_URL = getChannelLiveHlsUrl();

function VersionRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border flex items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <strong className="text-sm">v{value}</strong>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="border-border bg-muted/30 flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2">
        <code className="min-w-0 flex-1 truncate text-xs">{value}</code>
        <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
          <Copy className="size-3.5" />
          {copied ? "복사됨" : "복사"}
        </Button>
      </div>
    </div>
  );
}

export default function ChannelSecuritySettingsPage({ initialSnapshot }: Props) {
  const settings = initialSnapshot?.settings;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">보안과 송출 설정</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          OBS 송출 주소, 스트림 경로, 미리보기 주소를 확인합니다.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RadioTower className="text-brand size-4" />
              OBS 송출 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <CopyField label="서버 URL" value={OBS_SERVER_URL} />
            <CopyField label="스트림 키" value={STREAM_PATH} />
            <CopyField label="전체 송출 URL" value={OBS_PUBLISH_URL} />
            <CopyField label="HLS 미리보기 URL" value={HLS_PREVIEW_URL} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="text-brand size-4" />
              보안 상태
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <VersionRow label="스트림키 버전" value={settings?.streamKeyVersion ?? 1} />
            <VersionRow label="채팅 오버레이 버전" value={settings?.chatOverlayVersion ?? 1} />
            <VersionRow label="후원 알림 버전" value={settings?.donationAlertVersion ?? 1} />
            <div className="border-warning/30 bg-warning/10 text-warning rounded-lg border p-3 text-xs">
              스트림키 재발급은 현재 브랜치의 RPC 타입에 없습니다. 실제 재발급 기능은 별도 RPC가
              추가된 뒤 연결하는 구조가 좋습니다.
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="text-brand size-4" />
              OBS 입력값
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="border-border rounded-lg border p-3">
              <span className="text-muted-foreground text-xs">OBS 서버</span>
              <p className="mt-1 text-sm font-semibold">{OBS_SERVER_URL}</p>
            </div>
            <div className="border-border rounded-lg border p-3">
              <span className="text-muted-foreground text-xs">OBS 스트림 키</span>
              <p className="mt-1 text-sm font-semibold">{STREAM_PATH}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";
// 방송 상태, 방송 시간, 해상도, 비트레이트, FPS 정보를 표시합니다.

import type { ChannelLiveState } from "@/components/channel/live/channel-live-operation-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ChannelLiveStreamStatusResponse } from "@/types/channel/channel-live-stream";
import { Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  activeBroadcastStartedAt?: string | null;
  liveState: ChannelLiveState;
  streamPath: string;
  variant?: "card" | "embedded";
}

interface BitrateSample {
  checkedAt: number;
  inboundBytes: number;
}

const STREAM_STATUS_POLL_INTERVAL_MS = 3000;
const STREAM_DURATION_TICK_INTERVAL_MS = 1000;
const DEFAULT_STREAM_DURATION = "00:00:00";

function formatDuration(startedAt?: string | null) {
  if (!startedAt) return DEFAULT_STREAM_DURATION;

  const startedAtTime = new Date(startedAt).getTime();

  if (!Number.isFinite(startedAtTime)) return DEFAULT_STREAM_DURATION;

  const totalSeconds = Math.max(Math.floor((Date.now() - startedAtTime) / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatBitrate(value: number | null) {
  if (value === null) return "-";

  return `${Math.round(value).toLocaleString()} Kbps`;
}

function formatResolution(status: ChannelLiveStreamStatusResponse | null) {
  if (!status?.width || !status.height) return "-";

  return `${status.width} x ${status.height}`;
}

function getStatusLabel(status: ChannelLiveStreamStatusResponse | null) {
  if (!status) return "확인 중";
  if (status.state === "online") return "온라인";
  if (status.state === "offline") return "오프라인";

  return "확인 불가";
}

function getStatusClassName(status: ChannelLiveStreamStatusResponse | null) {
  if (status?.state === "online") {
    return "bg-live/10 text-live inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";
  }

  return "bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";
}

function StreamStatusContent({
  durationLabel,
  isOnline,
  liveState,
  bitrateKbps,
  streamStatus,
}: {
  durationLabel: string;
  isOnline: boolean;
  liveState: ChannelLiveState;
  bitrateKbps: number | null;
  streamStatus: ChannelLiveStreamStatusResponse | null;
}) {
  const streamStats = [
    {
      label: "방송 시간",
      value: durationLabel,
    },
    { label: "해상도", value: formatResolution(streamStatus) },
    { label: "비트레이트", value: isOnline ? formatBitrate(bitrateKbps) : "-" },
    { label: "FPS", value: streamStatus?.fps ? String(streamStatus.fps) : "-" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border bg-muted/40 flex items-center justify-between rounded-xl border p-4">
        <span className="text-muted-foreground text-sm font-semibold">온라인 상태</span>
        <span className={getStatusClassName(streamStatus)}>
          <Radio className="size-3.5" />
          {getStatusLabel(streamStatus)}
        </span>
      </div>

      <div className="grid gap-2">
        {streamStats.map((stat) => (
          <div
            key={stat.label}
            className="border-border bg-muted/40 flex items-center justify-between rounded-xl border px-4 py-3"
          >
            <span className="text-muted-foreground text-sm font-semibold">{stat.label}</span>
            <strong className="text-foreground text-sm font-bold">{stat.value}</strong>
          </div>
        ))}
      </div>

      {streamStatus?.state === "unavailable" && (
        <p className="text-muted-foreground text-xs">
          {streamStatus.errorMessage ?? "MediaMTX API 상태를 확인할 수 없습니다."}
        </p>
      )}

      {liveState.isBroadcasting && streamStatus?.state === "offline" && (
        <p className="text-muted-foreground text-xs">
          방송은 시작됐지만 OBS 송출 신호가 아직 확인되지 않았습니다.
        </p>
      )}
    </div>
  );
}

export default function ChannelLiveStreamStatusPanel({
  activeBroadcastStartedAt,
  liveState,
  streamPath,
  variant = "card",
}: Props) {
  const [streamStatus, setStreamStatus] = useState<ChannelLiveStreamStatusResponse | null>(null);
  const [bitrateKbps, setBitrateKbps] = useState<number | null>(null);
  const [durationLabel, setDurationLabel] = useState(DEFAULT_STREAM_DURATION);
  const previousSampleRef = useRef<BitrateSample | null>(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadStreamStatus = async () => {
      try {
        const response = await fetch(
          `/api/channel/live/stream-status?path=${encodeURIComponent(streamPath)}`,
          {
            cache: "no-store",
            signal: abortController.signal,
          },
        );

        if (!response.ok) return;

        const nextStatus = (await response.json()) as ChannelLiveStreamStatusResponse;

        if (!isMounted) return;

        if (nextStatus.inboundBytes !== null) {
          const checkedAt = new Date(nextStatus.checkedAt).getTime();
          const previousSample = previousSampleRef.current;

          if (previousSample && checkedAt > previousSample.checkedAt) {
            const elapsedSeconds = (checkedAt - previousSample.checkedAt) / 1000;
            const bytesDelta = nextStatus.inboundBytes - previousSample.inboundBytes;

            setBitrateKbps(bytesDelta >= 0 ? (bytesDelta * 8) / elapsedSeconds / 1000 : null);
          }

          previousSampleRef.current = {
            checkedAt,
            inboundBytes: nextStatus.inboundBytes,
          };
        } else {
          previousSampleRef.current = null;
          setBitrateKbps(null);
        }

        setStreamStatus(nextStatus);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("방송 송출 상태 조회 실패", error);
        }
      }
    };

    void loadStreamStatus();
    const interval = setInterval(loadStreamStatus, STREAM_STATUS_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(interval);
    };
  }, [streamPath]);

  useEffect(() => {
    const startedAt = streamStatus?.onlineTime ?? activeBroadcastStartedAt;

    const updateDuration = () => {
      setDurationLabel(formatDuration(startedAt));
    };

    updateDuration();
    const interval = setInterval(updateDuration, STREAM_DURATION_TICK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [activeBroadcastStartedAt, streamStatus?.onlineTime]);

  const isOnline = streamStatus?.state === "online";
  const content = (
    <StreamStatusContent
      durationLabel={durationLabel}
      isOnline={isOnline}
      liveState={liveState}
      bitrateKbps={bitrateKbps}
      streamStatus={streamStatus}
    />
  );

  if (variant === "embedded") {
    return (
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-foreground text-sm font-bold">스트림 상태</h3>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold",
              isOnline ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground",
            )}
          >
            {getStatusLabel(streamStatus)}
          </span>
        </div>
        {content}
      </section>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>스트림 상태</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

// 방송 상태, 방송 시간, 해상도, 비트레이트, FPS 정보를 표시합니다.
import type { ChannelLiveState } from "@/components/channel/live/channel-live-operation-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio } from "lucide-react";

interface Props {
  liveState: ChannelLiveState;
}

const OFFLINE_STREAM_STATS = [
  { label: "방송 시간", value: "00:00:00" },
  { label: "해상도", value: "-" },
  { label: "비트레이트", value: "-" },
  { label: "FPS", value: "-" },
];

const ONLINE_STREAM_STATS = [
  { label: "방송 시간", value: "00:12:34" },
  { label: "해상도", value: "1920 x 1080" },
  { label: "비트레이트", value: "6,000 Kbps" },
  { label: "FPS", value: "30" },
];

export default function ChannelLiveStreamStatusPanel({ liveState }: Props) {
  const streamStats = liveState.isBroadcasting ? ONLINE_STREAM_STATS : OFFLINE_STREAM_STATS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>스트림 상태</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="border-border flex items-center justify-between rounded-lg border p-3">
          <span className="text-muted-foreground text-sm">온라인 상태</span>
          <span
            className={
              liveState.isBroadcasting
                ? "bg-live/10 text-live inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                : "bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            }
          >
            <Radio className="size-3.5" />
            {liveState.isBroadcasting ? "온라인" : "오프라인"}
          </span>
        </div>

        <div className="grid gap-2">
          {streamStats.map((stat) => (
            <div
              key={stat.label}
              className="border-border flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <span className="text-muted-foreground text-sm">{stat.label}</span>
              <strong className="text-sm">{stat.value}</strong>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

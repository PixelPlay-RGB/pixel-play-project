// 방송 화면 미리보기 목업 영역을 렌더링합니다.
import type { ChannelLiveState } from "@/components/channel/live/channel-live-operation-page";
import { Card, CardContent } from "@/components/ui/card";
import { Radio } from "lucide-react";

interface Props {
  liveState: ChannelLiveState;
}

export default function ChannelLivePreviewPanel({ liveState }: Props) {
  return (
    <Card className="bg-brand/5 border-brand/10">
      <CardContent className="p-3">
        <div className="from-brand/10 via-background to-live/10 flex aspect-video min-h-56 overflow-hidden rounded-lg bg-linear-to-br">
          <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-2 text-center text-sm">
            <Radio className="text-brand size-8" />
            <span className="text-foreground font-semibold">
              {liveState.isBroadcasting ? "방송 화면 미리보기" : "송출 대기 중"}
            </span>
            <span>
              {liveState.isBroadcasting
                ? "실제 송출 연결 전까지 목업 화면으로 표시됩니다."
                : "방송 시작 후 송출 화면을 확인합니다."}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

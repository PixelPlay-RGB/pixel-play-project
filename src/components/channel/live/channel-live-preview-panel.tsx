// 방송 송출 미리보기 영역을 렌더링합니다.
import ChannelLivePreviewPlayer from "@/components/channel/live/channel-live-preview-player";
import type { ChannelLiveState } from "@/components/channel/live/channel-live-operation-page";
import { Card } from "@/components/ui/card";
import { getChannelLiveHlsUrl } from "@/constants/channel/channel-live-media";
import { Radio } from "lucide-react";

interface Props {
  liveState: ChannelLiveState;
  title: string;
}

export default function ChannelLivePreviewPanel({ liveState, title }: Props) {
  const hlsUrl = getChannelLiveHlsUrl();

  return (
    <Card className="border-brand/10 from-brand/10 via-background to-live/10 aspect-video min-h-56 gap-0 overflow-hidden bg-linear-to-br py-0">
      {liveState.isBroadcasting ? (
        <ChannelLivePreviewPlayer src={hlsUrl} title={title || "방송 미리보기"} />
      ) : (
        <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-2 text-center text-sm">
          <Radio className="text-brand size-8" />
          <span className="text-foreground font-semibold">송출 대기 중</span>
          <span>방송 시작 후 OBS 송출 화면이 표시됩니다.</span>
        </div>
      )}
    </Card>
  );
}

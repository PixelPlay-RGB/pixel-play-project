// 방송 운영용 채팅창 목업과 채팅 일시정지 제어를 렌더링합니다.
import type { ChannelLiveState } from "@/components/channel/live/channel-live-operation-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageCircle, Pause, Play } from "lucide-react";

interface Props {
  liveState: ChannelLiveState;
  onToggleChatPaused: () => void;
}

const MOCK_CHAT_MESSAGES = [
  { name: "하린", text: "오늘 방송 기다렸어요.", tone: "text-brand" },
  { name: "수연", text: "시작하면 바로 들어올게요.", tone: "text-info" },
  { name: "지호", text: "태그가 깔끔해서 찾기 좋네요.", tone: "text-live" },
];

export default function ChannelLiveChatPanel({ liveState, onToggleChatPaused }: Props) {
  return (
    <Card className="min-h-128 xl:h-[calc(100vh-2rem)]">
      <CardHeader className="has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1">
          <CardTitle>방송 채팅</CardTitle>
          <span className="text-muted-foreground text-xs">
            {liveState.isBroadcasting ? "실시간 채팅 목업" : "방송 시작 전 채팅 미리보기"}
          </span>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onToggleChatPaused}>
          {liveState.isChatPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          {liveState.isChatPaused ? "재개" : "일시정지"}
        </Button>
      </CardHeader>
      <CardContent className="flex min-h-96 flex-1 flex-col gap-3 overflow-hidden">
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-xs font-semibold",
            liveState.isChatPaused ? "bg-warning/10 text-warning" : "bg-brand/10 text-brand",
          )}
        >
          {liveState.isChatPaused
            ? "채팅이 일시정지되었습니다."
            : "채팅이 정상적으로 열려 있습니다."}
        </div>

        <div className="border-border flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border p-3">
          {!liveState.isBroadcasting && (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm">
              <MessageCircle className="size-8" />
              <div className="flex flex-col gap-1">
                <span>아직 방송이 시작되지 않았습니다.</span>
                <span>시작 후 시청자가 채팅에 참여할 수 있습니다.</span>
              </div>
            </div>
          )}

          {liveState.isBroadcasting &&
            MOCK_CHAT_MESSAGES.map((message) => (
              <div key={`${message.name}-${message.text}`} className="flex gap-2 text-sm">
                <strong className={cn("shrink-0", message.tone)}>{message.name}</strong>
                <span className="text-foreground min-w-0">{message.text}</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

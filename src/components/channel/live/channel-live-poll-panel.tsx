"use client";
// 방송 운영 화면에서 채팅 기반 투표, DB 기준 추첨, 룰렛 도구를 선택·조립합니다.

import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { ChannelLiveDrawToolView } from "@/components/channel/live/channel-live-draw-tool";
import { ChannelLiveRouletteToolView } from "@/components/channel/live/channel-live-roulette-tool";
import { ChannelLiveVoteToolView } from "@/components/channel/live/channel-live-vote-tool";
import { Button } from "@/components/ui/button";
import { INTERACTION_TOOLS } from "@/constants/channel/live-interaction";
import { useChannelLiveDrawTool } from "@/hooks/channel/use-channel-live-draw-tool";
import { useChannelLiveInteractionNotice } from "@/hooks/channel/use-channel-live-interaction-notice";
import { useChannelLiveRouletteTool } from "@/hooks/channel/use-channel-live-roulette-tool";
import { useChannelLiveVoteTool } from "@/hooks/channel/use-channel-live-vote-tool";
import { useLivePolls } from "@/hooks/live/use-live-polls";
import { cn } from "@/lib/utils";
import type { InteractionTool } from "@/types/channel/live-interaction";

interface Props {
  broadcastId: string | null;
  creatorId?: string;
}

export default function ChannelLivePollPanel({ broadcastId, creatorId }: Props) {
  const { polls, isLoading: isPollLoading } = useLivePolls(broadcastId, creatorId);
  const [selectedTool, setSelectedTool] = useState<InteractionTool | null>(null);

  // 도구를 오가도 진행 상태가 유지되도록 세 도구의 상태를 패널 수명으로 관리한다.
  const { publishInteractionNotice } = useChannelLiveInteractionNotice(broadcastId);
  const voteTool = useChannelLiveVoteTool(broadcastId, polls);
  const drawTool = useChannelLiveDrawTool(broadcastId, publishInteractionNotice);
  const rouletteTool = useChannelLiveRouletteTool(publishInteractionNotice);

  const selectedToolLabel = INTERACTION_TOOLS.find((tool) => tool.value === selectedTool)?.label;
  const isBackButtonDisabled =
    voteTool.isPollActionPending ||
    drawTool.isDrawRecruitmentPending ||
    (selectedTool === "draw" && drawTool.isDrawParticipantLoading);

  const handleBackToToolSelect = async () => {
    if (selectedTool === "poll" && !(await voteTool.exitTool())) return;
    if (selectedTool === "draw" && !(await drawTool.exitTool())) return;
    if (selectedTool === "roulette" && !(await rouletteTool.exitTool())) return;

    setSelectedTool(null);
  };

  return (
    // 풀블리드 섹션(ChannelLiveCollapsibleSection) 안 — 도구 미선택 시엔 내용 높이만 차지하고,
    // 도구 진행 화면에서만 고정 높이를 잡아 단계 전환 시 레이아웃 점프를 막는다.
    <section
      className={cn("flex min-h-0 min-w-0 flex-col gap-4", selectedTool !== null && "h-150")}
    >
      {selectedTool === null ? (
        <div className="grid gap-2.5 sm:grid-cols-3">
          {INTERACTION_TOOLS.map(({ icon: Icon, label, value }) => (
            <button
              key={value}
              type="button"
              className={cn(
                "border-border bg-background text-foreground flex items-center justify-center gap-2.5 rounded-lg border px-4 py-3.5 text-sm font-bold transition-colors",
                "hover:border-brand/40 hover:bg-brand/5 hover:text-brand",
              )}
              onClick={() => setSelectedTool(value)}
            >
              <span className="bg-brand/10 text-brand flex size-9 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-4.5" />
              </span>
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-xl font-bold"
              disabled={isBackButtonDisabled}
              onClick={() => void handleBackToToolSelect()}
            >
              <ArrowLeft className="size-4" />
              뒤로가기
            </Button>
            <span className="text-muted-foreground text-xs font-bold">{selectedToolLabel}</span>
          </div>

          {selectedTool === "poll" && (
            <ChannelLiveVoteToolView isPollLoading={isPollLoading} tool={voteTool} />
          )}

          {selectedTool === "draw" && (
            <ChannelLiveDrawToolView broadcastId={broadcastId} tool={drawTool} />
          )}

          {selectedTool === "roulette" && <ChannelLiveRouletteToolView tool={rouletteTool} />}
        </div>
      )}
    </section>
  );
}

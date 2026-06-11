"use client";
// 방송 운영 화면에서 채팅 기반 투표, DB 기준 추첨, 룰렛 도구를 선택·조립합니다.

import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChannelLiveDrawToolView } from "@/components/channel/live/channel-live-draw-tool";
import { ChannelLiveRouletteToolView } from "@/components/channel/live/channel-live-roulette-tool";
import { ChannelLiveVoteToolView } from "@/components/channel/live/channel-live-vote-tool";
import { Button } from "@/components/ui/button";
import { INTERACTION_TOOLS } from "@/constants/channel/live-interaction";
import { useChannelLiveDrawTool } from "@/hooks/channel/use-channel-live-draw-tool";
import { useChannelLiveInteractionNotice } from "@/hooks/channel/use-channel-live-interaction-notice";
import { useChannelLiveRouletteNotice } from "@/hooks/channel/use-channel-live-roulette-notice";
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
  // 도구 화면이 펼쳐지면 좌측 칼럼 스크롤을 바닥에 앵커한다(시청자 참여 섹션이 최하단).
  // 높이가 300ms transition으로 점점 늘어나므로, 전환 동안 매 프레임 바닥에 붙여
  // 펼쳐지는 만큼 스크롤이 함께 따라 내려가게 한다(닫힘은 브라우저가 자동 클램프해 줘 불필요).
  const toolViewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selectedTool) return;

    const findScrollParent = (node: HTMLElement | null): Element | null => {
      let current = node?.parentElement ?? null;
      while (current) {
        const { overflowY } = getComputedStyle(current);
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          current.scrollHeight > current.clientHeight
        ) {
          return current;
        }
        current = current.parentElement;
      }
      // xl 미만에선 칼럼이 아니라 문서 전체가 스크롤 컨테이너다.
      return document.scrollingElement;
    };

    const scroller = findScrollParent(toolViewRef.current);
    if (!scroller) return;

    // height transition(300ms) + 여유 동안 바닥 고정.
    const ANCHOR_DURATION_MS = 360;
    const startedAt = performance.now();
    let rafId = requestAnimationFrame(function tick(now) {
      scroller.scrollTop = scroller.scrollHeight;
      if (now - startedAt < ANCHOR_DURATION_MS) {
        rafId = requestAnimationFrame(tick);
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [selectedTool]);

  // 도구를 오가도 진행 상태가 유지되도록 세 도구의 상태를 패널 수명으로 관리한다.
  const { publishInteractionNotice } = useChannelLiveInteractionNotice(broadcastId);
  const { publishRouletteNotice } = useChannelLiveRouletteNotice(broadcastId);
  const voteTool = useChannelLiveVoteTool(broadcastId, polls);
  const drawTool = useChannelLiveDrawTool(broadcastId, publishInteractionNotice);
  const rouletteTool = useChannelLiveRouletteTool(publishRouletteNotice);

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
    // interpolate-size로 auto↔h-150 높이를 보간해, 뒤로가기 시 화면이 뚝 끊기지 않게 한다(미지원 브라우저는 즉시 전환).
    // overflow-hidden: 높이 보간 중 내부 콘텐츠가 section 밖으로 넘치면 scrollHeight가
    // 첫 프레임부터 최종값이 되어 바닥 앵커가 한 번에 점프한다(추첨처럼 콘텐츠가 큰 도구).
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden",
        "transition-[height] duration-300 ease-out [interpolate-size:allow-keywords]",
        selectedTool !== null && "h-150",
      )}
    >
      {selectedTool === null ? (
        // 뒤로가기로 돌아올 때도 도구 화면과 동일한 등장 모션을 줘 화면이 뚝 끊기지 않게 한다.
        // 부모 아코디언의 AnimatePresence(initial=false)가 하위 motion의 마운트 애니메이션을
        // 통째로 무시시키므로, presence 영향이 없는 CSS 애니메이션(key 리마운트마다 재생)을 쓴다.
        <div
          key="tool-select"
          className="animate-in fade-in slide-in-from-bottom-3 grid gap-2.5 py-2 duration-200 ease-out motion-reduce:animate-none sm:grid-cols-3"
        >
          {INTERACTION_TOOLS.map(({ icon: Icon, label, value, description }) => (
            // 브랜드 무드의 세로형 카드 — 민트 네온 hover에 아이콘 뱃지가 brand로 채워지며 살짝 떠오른다.
            <button
              key={value}
              type="button"
              className={cn(
                "group border-border bg-background flex flex-col items-center gap-3 rounded-xl border px-4 py-7 text-center transition-all",
                "hover:border-brand/40 hover:bg-brand/5 hover:-translate-y-0.5 hover:shadow-md",
              )}
              onClick={() => setSelectedTool(value)}
            >
              <span
                className={cn(
                  "bg-brand/10 text-brand flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                  "group-hover:bg-brand group-hover:text-brand-foreground",
                )}
              >
                <Icon className="size-6" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-foreground text-sm font-bold">{label}</span>
                <span className="text-muted-foreground text-xs">{description}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div
          key="tool-view"
          ref={toolViewRef}
          className="animate-in fade-in slide-in-from-bottom-3 flex min-h-0 flex-1 flex-col gap-4 duration-200 ease-out motion-reduce:animate-none"
        >
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

"use client";
// 방송 운영 룰렛 도구 화면 — 항목 편집과 휠 회전 연출을 렌더링합니다.

import { FerrisWheel, Plus, RotateCw, X } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROULETTE_SPIN_DURATION_SECONDS } from "@/constants/channel/live-interaction";
import type { ChannelLiveRouletteTool } from "@/hooks/channel/use-channel-live-roulette-tool";
import {
  getRouletteItemLabelStyle,
  getRouletteItemPercent,
} from "@/utils/channel/live-interaction";

interface Props {
  tool: ChannelLiveRouletteTool;
}

export function ChannelLiveRouletteToolView({ tool }: Props) {
  const {
    canStartRoulette,
    handleAddRouletteItem,
    handleRemoveRouletteItem,
    handleResetRouletteItems,
    handleRouletteAnimationComplete,
    handleRouletteItemLabelChange,
    handleSpinRoulette,
    handleStartRoulette,
    isRouletteSpinning,
    isRouletteStarted,
    rouletteItems,
    rouletteResult,
    rouletteRotationKeyframes,
    rouletteSegments,
    rouletteSegmentStyle,
    validRouletteItems,
  } = tool;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {!isRouletteStarted ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {rouletteItems.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[4.25rem_minmax(0,1fr)_4.5rem_2.5rem] items-center gap-2"
              >
                <span className="text-foreground text-sm font-black">항목 {index + 1}</span>
                <Input
                  value={item.label}
                  maxLength={24}
                  placeholder="투표 이름"
                  className="border-border bg-muted/30 h-10 rounded-xl px-4 text-sm"
                  onChange={(event) => handleRouletteItemLabelChange(index, event.target.value)}
                />
                <span className="text-foreground text-right text-xs font-black tabular-nums">
                  {item.label.trim() ? getRouletteItemPercent(validRouletteItems.length) : "0%"}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground rounded-xl"
                  onClick={() => handleRemoveRouletteItem(index)}
                >
                  <X className="size-5" />
                  <span className="sr-only">룰렛 항목 삭제</span>
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="border-brand text-brand hover:bg-brand/10 hover:text-brand h-14 w-full rounded-lg text-base font-black"
              onClick={handleAddRouletteItem}
            >
              <Plus className="size-4" />
              항목 추가
            </Button>
            <Button
              type="button"
              className="bg-brand hover:bg-brand/90 h-14 rounded-lg px-10 text-base font-black text-white"
              disabled={!canStartRoulette}
              onClick={handleStartRoulette}
            >
              룰렛 시작
            </Button>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6">
          <div className="relative flex size-72 items-center justify-center">
            <div className="absolute top-8 right-10 z-20 rotate-[225deg] drop-shadow-lg">
              <div
                className="bg-border h-10 w-5"
                style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
              />
              <div
                className="bg-destructive absolute top-0.5 left-0.5 h-9 w-4"
                style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
              />
            </div>
            <motion.div
              className="border-background relative size-64 overflow-hidden rounded-full border-8 shadow-lg"
              style={rouletteSegmentStyle}
              animate={{ rotate: rouletteRotationKeyframes }}
              transition={
                isRouletteSpinning
                  ? {
                      duration: ROULETTE_SPIN_DURATION_SECONDS,
                      ease: ["easeOut", "linear", "easeOut"],
                      times: [0, 0.14, 0.58, 1],
                    }
                  : { duration: 0 }
              }
              onAnimationComplete={handleRouletteAnimationComplete}
            >
              {rouletteSegments.map((segment) => (
                <span
                  key={`${segment.item.label}-${segment.index}-wheel`}
                  className="absolute top-1/2 left-1/2 w-20 truncate text-center text-xs font-black text-white drop-shadow"
                  style={getRouletteItemLabelStyle(segment.centerDegree)}
                >
                  {segment.item.label}
                </span>
              ))}
            </motion.div>
            <div className="bg-background border-border absolute flex size-20 flex-col items-center justify-center rounded-full border shadow-sm">
              <FerrisWheel className="text-brand size-6" />
              <span className="text-muted-foreground text-xs font-bold">ROULETTE</span>
            </div>
          </div>

          <strong className="text-foreground text-lg font-black">
            {isRouletteSpinning ? "돌리는 중" : (rouletteResult ?? "룰렛 대기")}
          </strong>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="border-brand text-brand hover:bg-brand/10 hover:text-brand h-12 rounded-lg px-8 text-base font-black"
              disabled={isRouletteSpinning}
              onClick={handleResetRouletteItems}
            >
              항목 다시 설정하기
            </Button>
            <Button
              type="button"
              className="bg-brand hover:bg-brand/90 h-12 rounded-lg px-8 text-base font-black text-white"
              disabled={!canStartRoulette || isRouletteSpinning}
              onClick={handleSpinRoulette}
            >
              <RotateCw className="size-4" />
              돌려!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

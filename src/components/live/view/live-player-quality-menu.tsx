"use client";
// 라이브 플레이어 화질 메뉴 — 화질 선택은 #73 머지 후 연결 예정이라 현재는 비활성 셸입니다.
// TODO(#73 머지 후): hls.levels와 currentLevel을 받아 화질 목록·선택 드롭다운을 동작시킨다.

import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LIVE_LABEL, LIVE_PLAYER_ICON_BUTTON_CLASS } from "@/constants/live/live";

export function LivePlayerQualityMenu() {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      disabled
      aria-label={LIVE_LABEL.playerQuality}
      className={LIVE_PLAYER_ICON_BUTTON_CLASS}
    >
      <Settings className="size-5" />
    </Button>
  );
}

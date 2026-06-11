"use client";
// 라이브 플레이어 화질 메뉴 — hls.js 레벨 목록을 받아 자동/해상도 선택 드롭다운을 제공합니다.
// 네이티브 HLS(Safari)나 레벨 미파싱 상태에선 선택지가 없어 메뉴를 숨깁니다.

import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LIVE_LABEL, LIVE_PLAYER_ICON_BUTTON_CLASS } from "@/constants/live/live";
import type { HlsQualityLevel } from "@/hooks/live/use-hls-player";

const AUTO_VALUE = "-1";

interface Props {
  levels: HlsQualityLevel[];
  selectedLevel: number;
  onSelectLevel: (index: number) => void;
}

export function LivePlayerQualityMenu({ levels, selectedLevel, onSelectLevel }: Props) {
  // hls.js가 레벨을 파싱했을 때만 메뉴를 노출한다(네이티브 HLS·미파싱 상태에선 levels가 비어 숨김).
  if (levels.length === 0) return null;

  // 해상도가 높은 순으로 보여준다(없으면 인덱스 순 유지).
  const sortedLevels = [...levels].sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={LIVE_LABEL.playerQuality}
            className={LIVE_PLAYER_ICON_BUTTON_CLASS}
          />
        }
      >
        <Settings className="size-6" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={String(selectedLevel)}
            onValueChange={(value) => onSelectLevel(Number(value))}
          >
            <DropdownMenuRadioItem value={AUTO_VALUE}>
              {LIVE_LABEL.playerQualityAuto}
            </DropdownMenuRadioItem>
            {sortedLevels.map((level) => (
              <DropdownMenuRadioItem key={level.index} value={String(level.index)}>
                {level.height ? `${level.height}p` : `${level.index + 1}`}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

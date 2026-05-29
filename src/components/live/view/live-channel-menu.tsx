"use client";
// 채널 더보기 DropdownMenu — 공유, 신고 항목을 제공합니다.

import { useState } from "react";
import { MoreHorizontal, Share2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LIVE_CHANNEL_MENU_LABEL, LIVE_LABEL } from "@/constants/live/live";
import { LiveShareDialog } from "@/components/live/view/live-share-dialog";

export function LiveChannelMenu() {
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="sm" variant="outline" aria-label={LIVE_LABEL.more} className="size-8 p-0" />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuGroup>
            <DropdownMenuItem className="gap-2" onClick={() => setIsShareOpen(true)}>
              <Share2 className="size-4" />
              {LIVE_CHANNEL_MENU_LABEL.share}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive gap-2"
              variant="destructive"
              onClick={() => {
                // TODO: 신고 기능 구현
              }}
            >
              <Flag className="size-4" />
              {LIVE_CHANNEL_MENU_LABEL.report}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <LiveShareDialog open={isShareOpen} onOpenChange={setIsShareOpen} />
    </>
  );
}

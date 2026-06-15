"use client";
// 라이브 유저관리 Dialog — 강퇴 권한자(크리에이터/매니저)가 채널 제재 이력을 보고 강퇴를 해제한다.
// 본문 목록은 스튜디오 시청자 관리 페이지와 같은 공유 섹션(ChannelViewerBanSection)을 마운트한다 —
// 같은 훅·queryKey 를 공유하므로 여기서 해제하면 스튜디오도 자동 동기화된다.
// 섹션은 Dialog 가 열렸을 때만 마운트돼 그때 조회한다(enabled: open).

import { useState } from "react";

import { UserCog } from "lucide-react";

import { ChannelViewerBanSection } from "@/components/channel/moderation/channel-viewer-ban-section";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  creatorId: string;
}

export function LiveUserManageDialog({ creatorId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-full text-xs font-semibold"
          >
            <UserCog className="size-4" />
            유저관리
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>유저 관리</DialogTitle>
          <DialogDescription>강퇴한 시청자를 확인하고 강퇴를 해제할 수 있어요.</DialogDescription>
        </DialogHeader>
        {open ? <ChannelViewerBanSection creatorId={creatorId} scrollable /> : null}
      </DialogContent>
    </Dialog>
  );
}

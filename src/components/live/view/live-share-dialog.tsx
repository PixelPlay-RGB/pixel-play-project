"use client";
// URL 공유 Dialog — 현재 페이지 URL을 표시하고 클립보드에 복사합니다.

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LIVE_CHANNEL_MENU_LABEL, LIVE_LABEL } from "@/constants/live/live";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppSuccess, toastAppError } from "@/utils/common/toast-message";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LiveShareDialog({ open, onOpenChange }: Props) {
  const url = typeof window !== "undefined" ? window.location.href : "";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      toastAppSuccess(APP_MESSAGE_CODE.success.live.urlCopied);
    } catch {
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{LIVE_CHANNEL_MENU_LABEL.share}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input readOnly value={url} className="flex-1 text-sm" />
          <Button size="sm" onClick={handleCopy} className="shrink-0 gap-1.5">
            <Copy className="size-4" />
            {LIVE_LABEL.shareCopy}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

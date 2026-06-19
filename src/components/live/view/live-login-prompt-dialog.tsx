// 비로그인 사용자에게 로그인을 안내하는 Dialog입니다.

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import { LogIn, MessageCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
  // 전체화면 요소 안에서 열릴 때 그 노드를 포털 대상으로 받는다(미지정 시 기본 body라 전체화면 밖에 렌더돼 안 보임).
  container?: HTMLElement | null;
}

export function LiveLoginPromptDialog({ open, onOpenChange, onLogin, container }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        container={container ?? undefined}
        showCloseButton={false}
        className={cn(
          "overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-md",
          "border-live/20 shadow-live/10 dark:border-live/15",
        )}
      >
        <DialogHeader className="border-live/10 bg-live/5 border-b px-5 pt-5 pb-4 text-left">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "bg-live/10 text-live ring-live/20 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1",
              )}
            >
              <MessageCircle className="size-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg leading-6 font-bold text-pretty">
                {LIVE_LABEL.loginRequired}
              </DialogTitle>
              <DialogDescription className="mt-1.5 leading-relaxed text-pretty">
                {LIVE_LABEL.loginDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-5 py-4">
          <div className="border-live/15 bg-live/5 rounded-xl border p-4">
            <p className="text-foreground text-sm font-bold">
              {LIVE_LABEL.loginPromptSummaryTitle}
            </p>
            <ul className="text-muted-foreground mt-3 grid gap-2 text-sm leading-5">
              {LIVE_LABEL.loginPromptSummaryItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="bg-live mt-2 size-1.5 shrink-0 rounded-full" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-5 pt-0 pb-5">
          <Button variant="outline" className="h-11 min-w-24" onClick={() => onOpenChange(false)}>
            {LIVE_LABEL.cancel}
          </Button>
          <Button onClick={onLogin} className="bg-live hover:bg-live/90 h-11 min-w-24 text-white">
            <LogIn className="size-4" />
            {LIVE_LABEL.loginButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

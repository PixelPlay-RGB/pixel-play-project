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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
}

export function LiveLoginPromptDialog({ open, onOpenChange, onLogin }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{LIVE_LABEL.loginRequired}</DialogTitle>
          <DialogDescription>{LIVE_LABEL.loginDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {LIVE_LABEL.cancel}
          </Button>
          <Button onClick={onLogin} className="bg-brand hover:bg-brand/90 text-brand-foreground">
            {LIVE_LABEL.loginButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

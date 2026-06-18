"use client";
// 후원 지갑 충전 결제창을 다이얼로그로 띄우는 UI를 제공합니다.

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WalletChargeCard } from "@/components/donations/wallet-charge-card";
import { cn } from "@/lib/utils";
import { CreditCard } from "lucide-react";
import type { ReactElement } from "react";

interface WalletChargeDialogProps {
  customerKey: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactElement | null;
}

export function WalletChargeDialog({
  customerKey,
  className,
  open,
  onOpenChange,
  trigger,
}: WalletChargeDialogProps) {
  const defaultTrigger = (
    <Button
      type="button"
      className={cn(
        "bg-background text-live hover:bg-background/90 h-10 px-4 font-black shadow-sm",
        "dark:text-live dark:bg-white dark:hover:bg-white/90",
        className,
      )}
    >
      <CreditCard className="size-4" />
      충전하기
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger !== null ? <DialogTrigger render={trigger ?? defaultTrigger} /> : null}
      <DialogContent
        className={cn(
          "overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-lg",
          "border-live/20 shadow-live/10 dark:border-live/10",
        )}
      >
        <DialogHeader className="border-live/10 bg-live/5 border-b px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <span className="bg-live/10 text-live ring-live/20 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
              <CreditCard className="size-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold">포인트 충전</DialogTitle>
              <DialogDescription className="mt-1 leading-relaxed">
                충전할 포인트를 선택하고 Toss Payments 결제창으로 결제를 진행합니다.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-5 pt-1 pb-5">
          <WalletChargeCard customerKey={customerKey} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

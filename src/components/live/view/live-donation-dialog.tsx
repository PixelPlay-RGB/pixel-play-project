"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LIVE_DONATION_AMOUNTS,
  LIVE_DONATION_LABEL,
  LIVE_LABEL,
} from "@/constants/live/live";
import { cn } from "@/lib/utils";
import { formatDonationAmount } from "@/utils/live/live-chat";

interface Props {
  onLoginPrompt: () => void;
  isLoggedIn: boolean;
  walletBalance: number;
  isWalletLoading?: boolean;
  isWalletError?: boolean;
  onDonate: (params: {
    amount: number;
    message: string;
    isAnonymous: boolean;
    idempotencyKey: string;
  }) => Promise<boolean>;
}

export function LiveDonationDialog({ onLoginPrompt, isLoggedIn, walletBalance, isWalletLoading, isWalletError, onDonate }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(LIVE_DONATION_AMOUNTS[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (next && !isLoggedIn) {
      onLoginPrompt();
      return;
    }
    setOpen(next);
  }

  const remaining = walletBalance - selectedAmount;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            className="bg-brand hover:bg-brand/90 text-brand-foreground flex-1 text-xs"
            size="sm"
          />
        }
      >
        {LIVE_LABEL.donate}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{LIVE_DONATION_LABEL.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="accent-brand size-4"
            />
            {LIVE_DONATION_LABEL.anonymous}
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{LIVE_DONATION_LABEL.amountLabel}</span>
            <div className="grid grid-cols-3 gap-2">
              {LIVE_DONATION_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedAmount(amount)}
                  className={cn(
                    "h-auto px-2 py-2 text-sm",
                    selectedAmount === amount
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-foreground hover:border-brand/50",
                  )}
                >
                  {formatDonationAmount(amount)}
                  {LIVE_DONATION_LABEL.unit}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              placeholder={LIVE_DONATION_LABEL.directInput}
              className="text-sm"
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 0) setSelectedAmount(val);
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{LIVE_DONATION_LABEL.messageLabel}</span>
            <Textarea
              placeholder={LIVE_DONATION_LABEL.messagePlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none text-sm"
              rows={2}
            />
          </div>

          <div className="bg-muted/50 text-muted-foreground flex flex-col gap-1 rounded-lg px-3 py-2 text-xs">
            <div className="flex justify-between">
              <span>{LIVE_DONATION_LABEL.balance}</span>
              <span>
                {isWalletLoading
                  ? LIVE_DONATION_LABEL.balanceLoading
                  : isWalletError
                  ? LIVE_DONATION_LABEL.balanceError
                  : `${formatDonationAmount(walletBalance)}${LIVE_DONATION_LABEL.unit}`}
              </span>
            </div>
            <div className="text-foreground flex justify-between font-medium">
              <span>{LIVE_DONATION_LABEL.afterBalance}</span>
              <span className={cn(remaining < 0 && "text-destructive")}>
                {formatDonationAmount(Math.max(remaining, 0))}
                {LIVE_DONATION_LABEL.unit}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" disabled={isSubmitting} onClick={() => setOpen(false)}>
            {LIVE_DONATION_LABEL.cancel}
          </Button>
          <Button
            type="button"
            disabled={remaining < 0 || isSubmitting || !!isWalletLoading}
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
            onClick={() => {
              void (async () => {
                setIsSubmitting(true);
                const success = await onDonate({
                  amount: selectedAmount,
                  message,
                  isAnonymous,
                  idempotencyKey: crypto.randomUUID(),
                });
                setIsSubmitting(false);
                if (success) setOpen(false);
              })();
            }}
          >
            {LIVE_DONATION_LABEL.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

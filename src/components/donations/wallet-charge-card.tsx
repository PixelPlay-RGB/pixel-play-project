"use client";
// 후원 지갑 충전 금액 입력 UI를 제공합니다.

import { SettingsCard } from "@/components/common/settings-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CreditCard } from "lucide-react";
import { FormEvent, useId, useMemo, useState } from "react";

const PRESET_AMOUNTS = [5000, 10000, 30000, 50000];
const DEFAULT_AMOUNT = PRESET_AMOUNTS[1];

export function WalletChargeCard() {
  const amountInputId = useId();
  const [amount, setAmount] = useState(String(DEFAULT_AMOUNT));
  const numericAmount = useMemo(() => Number(amount), [amount]);
  const isValidAmount = Number.isFinite(numericAmount) && numericAmount >= 1000;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <SettingsCard
      title="지갑 충전"
      description="충전 금액을 선택하거나 직접 입력할 수 있습니다."
      contentClassName="gap-4"
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_AMOUNTS.map((presetAmount) => {
            const isSelected = numericAmount === presetAmount;

            return (
              <Button
                key={presetAmount}
                type="button"
                variant={isSelected ? "default" : "outline"}
                aria-pressed={isSelected}
                className={cn("h-10", isSelected && "bg-brand hover:bg-brand/90")}
                onClick={() => setAmount(String(presetAmount))}
              >
                {formatWon(presetAmount)}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={amountInputId}>직접 입력</Label>
          <div className="relative">
            <Input
              id={amountInputId}
              type="number"
              inputMode="numeric"
              min={1000}
              step={1000}
              value={amount}
              aria-invalid={!isValidAmount}
              className="pr-10"
              onChange={(event) => setAmount(event.target.value)}
            />
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
              원
            </span>
          </div>
          <p className="text-muted-foreground text-xs">최소 충전 금액은 1,000원입니다.</p>
        </div>

        <div className="bg-muted/40 flex items-center justify-between gap-3 rounded-lg px-4 py-3">
          <span className="text-muted-foreground text-sm">충전 예정 금액</span>
          <strong className="text-foreground text-base">
            {isValidAmount ? formatWon(numericAmount) : "0원"}
          </strong>
        </div>

        <Button type="submit" size="lg" disabled className="w-full">
          <CreditCard />
          충전 준비 중
        </Button>
      </form>
    </SettingsCard>
  );
}

function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

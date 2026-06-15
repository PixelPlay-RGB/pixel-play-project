"use client";
// 구독 개월별 채팅 배지 이미지를 업로드하고 기본값으로 되돌리는 설정 카드입니다.

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { RotateCcw, Upload } from "lucide-react";

import {
  deleteChannelSubscriptionBadgeAction,
  uploadChannelSubscriptionBadgeAction,
} from "@/actions/channel/subscription-badge";
import { SettingsCard } from "@/components/common/settings-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import {
  getLiveDefaultSubscriptionBadgeSrc,
  getLiveSubscriptionBadgePublicUrl,
  LIVE_SUBSCRIPTION_BADGE_FIXED_MONTHS,
  LIVE_SUBSCRIPTION_BADGE_MAX_MONTH,
  LIVE_SUBSCRIPTION_BADGE_MIN_CUSTOM_MONTH,
} from "@/utils/live/live-subscription-badge";

interface Props {
  creatorId: string;
  customMonths: number[];
}

interface BadgeSlotProps {
  creatorId: string;
  month: number;
  isCustomSlot: boolean;
  onCustomSlotDeleted: (month: number) => void;
}

function getMonthLabel(month: number) {
  return `${month}개월`;
}

function sortMonths(months: readonly number[]) {
  return [...months].sort((a, b) => a - b);
}

export function ChannelSubscriptionBadgeSettingsCard({ creatorId, customMonths }: Props) {
  const [customSlots, setCustomSlots] = useState(() => sortMonths(customMonths));
  const [customMonthInput, setCustomMonthInput] = useState("");
  const [customMonthError, setCustomMonthError] = useState<string | null>(null);

  const months = sortMonths([...LIVE_SUBSCRIPTION_BADGE_FIXED_MONTHS, ...customSlots]);

  function handleAddCustomMonth() {
    const month = Number(customMonthInput);

    if (
      !Number.isInteger(month) ||
      month < LIVE_SUBSCRIPTION_BADGE_MIN_CUSTOM_MONTH ||
      month > LIVE_SUBSCRIPTION_BADGE_MAX_MONTH
    ) {
      setCustomMonthError("19개월부터 120개월까지 입력할 수 있어요.");
      return;
    }

    if (months.includes(month)) {
      setCustomMonthError("이미 있는 구독 배지 구간이에요.");
      return;
    }

    setCustomSlots((prev) => sortMonths([...prev, month]));
    setCustomMonthInput("");
    setCustomMonthError(null);
  }

  return (
    <SettingsCard
      title="구독 배지 설정"
      description="구독 기간별 채팅 배지를 설정해요. 배지는 가로세로 60px인 PNG 파일만 올릴 수 있어요."
    >
      <div className="border-border bg-muted/30 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-foreground text-sm font-bold">추가 구간 만들기</span>
          <p className="text-muted-foreground text-xs leading-5">
            18개월 이후 구간은 원하는 개월 수를 직접 추가한 뒤 이미지를 올려요.
          </p>
        </div>
        <div className="flex w-full flex-col gap-1 sm:w-64">
          <div className="flex gap-2">
            <Input
              type="number"
              min={LIVE_SUBSCRIPTION_BADGE_MIN_CUSTOM_MONTH}
              max={LIVE_SUBSCRIPTION_BADGE_MAX_MONTH}
              value={customMonthInput}
              onChange={(event) => {
                setCustomMonthInput(event.target.value);
                setCustomMonthError(null);
              }}
              placeholder="예: 24"
              className="h-10"
            />
            <Button type="button" variant="outline" className="h-10" onClick={handleAddCustomMonth}>
              추가
            </Button>
          </div>
          {customMonthError ? (
            <p className="text-destructive text-xs font-medium">{customMonthError}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {months.map((month) => (
          <BadgeSlot
            key={month}
            creatorId={creatorId}
            month={month}
            isCustomSlot={month >= LIVE_SUBSCRIPTION_BADGE_MIN_CUSTOM_MONTH}
            onCustomSlotDeleted={(deletedMonth) =>
              setCustomSlots((prev) => prev.filter((item) => item !== deletedMonth))
            }
          />
        ))}
      </div>
    </SettingsCard>
  );
}

function BadgeSlot({ creatorId, month, isCustomSlot, onCustomSlotDeleted }: BadgeSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(() => Date.now());
  const [usesFallback, setUsesFallback] = useState(false);
  const [isPending, startTransition] = useTransition();

  const storageSrc = `${getLiveSubscriptionBadgePublicUrl(creatorId, month, [month])}?v=${version}`;
  const fallbackSrc = getLiveDefaultSubscriptionBadgeSrc(month);
  const imageSrc = usesFallback ? fallbackSrc : storageSrc;

  function handleUpload(file: File | undefined) {
    if (!file) return;

    const formData = new FormData();
    formData.append("month", String(month));
    formData.append("file", file);

    startTransition(async () => {
      try {
        const result = await uploadChannelSubscriptionBadgeAction(formData);
        if (!result.success || !result.data) {
          toastAppError(result.code ?? "error.channel.subscriptionBadgeSaveFailed");
          return;
        }

        setUsesFallback(false);
        setVersion(result.data.updatedAt);
        toastAppSuccess(result.code ?? "success.channel.subscriptionBadgeSaved");
      } catch (error) {
        console.error("구독 배지 업로드 실패", error);
        toastAppError("error.channel.subscriptionBadgeSaveFailed");
      } finally {
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        const result = await deleteChannelSubscriptionBadgeAction(month);
        if (!result.success || !result.data) {
          toastAppError(result.code ?? "error.channel.subscriptionBadgeDeleteFailed");
          return;
        }

        setUsesFallback(true);
        setVersion(result.data.updatedAt);
        if (isCustomSlot) {
          onCustomSlotDeleted(month);
        }
        toastAppSuccess(result.code ?? "success.channel.subscriptionBadgeDeleted");
      } catch (error) {
        console.error("구독 배지 삭제 실패", error);
        toastAppError("error.channel.subscriptionBadgeDeleteFailed");
      }
    });
  }

  return (
    <div className="border-border bg-card flex min-w-0 flex-col gap-4 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-foreground text-sm font-bold">{getMonthLabel(month)}</span>
          <span className="text-muted-foreground text-xs">
            {isCustomSlot ? "사용자 추가 구간" : "고정 구간"}
          </span>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted-foreground text-[11px] font-bold">원본</span>
            <span className="border-border bg-background flex size-15 items-center justify-center overflow-hidden rounded-full border">
              <Image
                src={imageSrc}
                alt=""
                aria-hidden
                width={60}
                height={60}
                className="size-full object-contain"
                onError={() => setUsesFallback(true)}
              />
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted-foreground text-[11px] font-bold">채팅</span>
            <span className="border-border bg-background flex size-5 items-center justify-center overflow-hidden rounded-full border">
              <Image
                src={imageSrc}
                alt=""
                aria-hidden
                width={20}
                height={20}
                className="size-full object-contain"
                onError={() => setUsesFallback(true)}
              />
            </span>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={(event) => handleUpload(event.target.files?.[0])}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          변경
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={cn("flex-1", isCustomSlot && "text-destructive hover:text-destructive")}
          disabled={isPending}
          onClick={handleDelete}
        >
          <RotateCcw className="size-4" />
          {isCustomSlot ? "삭제" : "기본값"}
        </Button>
      </div>
    </div>
  );
}

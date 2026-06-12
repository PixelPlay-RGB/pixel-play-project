"use client";
// 클립 생성 Dialog — 스냅샷 위 크롭 위치 드래그 + 9:16 미리보기 + 제목(기본값=방송 제목)
// + 길이 슬라이더(15~30초)로 구성합니다. 제출은 부모(useClipCreation)가 처리한다.

import { useEffect, useState } from "react";
import { Scissors } from "lucide-react";

import { ClipCropSelector } from "@/components/clip/clip-crop-selector";
import { ClipVerticalPreview } from "@/components/clip/clip-vertical-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  CLIP_DURATION_DEFAULT_SECONDS,
  CLIP_DURATION_MAX_SECONDS,
  CLIP_DURATION_MIN_SECONDS,
  CLIP_LABEL,
  CLIP_TITLE_MAX_LENGTH,
} from "@/constants/clip/clip";
import type { CreateLiveClipInput } from "@/actions/clip/clip";

const DEFAULT_CROP_X_FRACTION = 0.5;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // 버튼 클릭 시점의 현재 프레임(jpeg data URL). 캡처 실패면 null — 생성은 가능.
  snapshotDataUrl: string | null;
  // 제목 입력칸 기본값 = 방송 제목(비우고 제출하면 서버가 같은 규칙으로 폴백).
  defaultTitle: string;
  isSubmitting: boolean;
  onSubmit: (input: CreateLiveClipInput) => Promise<boolean>;
}

export function ClipCreateDialog({
  open,
  onOpenChange,
  snapshotDataUrl,
  defaultTitle,
  isSubmitting,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(defaultTitle);
  const [durationSeconds, setDurationSeconds] = useState(CLIP_DURATION_DEFAULT_SECONDS);
  const [cropXFraction, setCropXFraction] = useState(DEFAULT_CROP_X_FRACTION);

  // 열 때마다 새 요청 기준으로 초기화한다(직전 입력이 남으면 다른 순간의 클립에 섞인다).
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(defaultTitle);
    setDurationSeconds(CLIP_DURATION_DEFAULT_SECONDS);
    setCropXFraction(DEFAULT_CROP_X_FRACTION);
  }, [open, defaultTitle]);

  async function handleSubmit() {
    const success = await onSubmit({ title, durationSeconds, cropXFraction });
    if (success) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{CLIP_LABEL.createDialogTitle}</DialogTitle>
          <DialogDescription>{CLIP_LABEL.createDialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex min-w-0 items-stretch gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <ClipCropSelector
              snapshotDataUrl={snapshotDataUrl}
              cropXFraction={cropXFraction}
              onCropXFractionChange={setCropXFraction}
            />
            <p className="text-muted-foreground text-xs">{CLIP_LABEL.cropGuide}</p>
          </div>
          <ClipVerticalPreview
            snapshotDataUrl={snapshotDataUrl}
            cropXFraction={cropXFraction}
            className="hidden sm:flex"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="clip-title" className="text-foreground text-sm font-medium">
            {CLIP_LABEL.titleLabel}
          </label>
          <Input
            id="clip-title"
            value={title}
            maxLength={CLIP_TITLE_MAX_LENGTH}
            placeholder={CLIP_LABEL.titlePlaceholder}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">{CLIP_LABEL.durationLabel}</span>
            <span className="text-muted-foreground text-sm tabular-nums">
              {durationSeconds}
              {CLIP_LABEL.durationUnit}
            </span>
          </div>
          <Slider
            value={durationSeconds}
            min={CLIP_DURATION_MIN_SECONDS}
            max={CLIP_DURATION_MAX_SECONDS}
            step={1}
            onValueChange={setDurationSeconds}
            aria-label={CLIP_LABEL.durationLabel}
            className="cursor-pointer"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            className="cursor-pointer"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            <Scissors aria-hidden />
            {isSubmitting ? CLIP_LABEL.submitting : CLIP_LABEL.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

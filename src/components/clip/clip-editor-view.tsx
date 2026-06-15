"use client";
// 클립 에디터 풀페이지 — 라이브 가위 버튼이 넘긴 스냅샷 위에서 크롭 위치·제목·길이를 정하고
// 생성한다. 생성 후엔 같은 화면에서 처리 중 → 완료/실패 단계까지 보여주는 자기완결적 흐름.
// 핸드오프 없이 직접 진입하면 안내 화면으로 폴백한다.

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Scissors, TriangleAlert, X } from "lucide-react";

import { ClipCropSelector } from "@/components/clip/clip-crop-selector";
import { ClipVerticalPreview } from "@/components/clip/clip-vertical-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  CLIP_DURATION_DEFAULT_SECONDS,
  CLIP_DURATION_MAX_SECONDS,
  CLIP_DURATION_MIN_SECONDS,
  CLIP_LABEL,
  CLIP_TITLE_MAX_LENGTH,
} from "@/constants/clip/clip";
import { useClipCreation } from "@/hooks/clip/use-clip-creation";
import { useClipEditorStore, type ClipEditorHandoff } from "@/stores/clip-editor";

const DEFAULT_CROP_X_FRACTION = 0.5;

interface Props {
  creatorId: string;
}

export function ClipEditorView({ creatorId }: Props) {
  const router = useRouter();
  const clearHandoff = useClipEditorStore((state) => state.clearHandoff);

  // 핸드오프는 첫 렌더에서 동기적으로 읽는다 — 라이브에서 client 이동 시 store에 들어 있고,
  // 직접 진입·새로고침이면 null이라 곧바로 안내 화면으로 폴백한다(깜빡임 없음).
  const [handoff] = useState<ClipEditorHandoff | null>(() => {
    const current = useClipEditorStore.getState().handoff;
    return current && current.creatorId === creatorId ? current : null;
  });

  const [title, setTitle] = useState(() => handoff?.defaultTitle ?? "");
  const [durationSeconds, setDurationSeconds] = useState(CLIP_DURATION_DEFAULT_SECONDS);
  const [cropXFraction, setCropXFraction] = useState(DEFAULT_CROP_X_FRACTION);

  const { createClip, status, readyClipId, reset } = useClipCreation(creatorId);

  // 한 번 읽은 핸드오프는 store에서 비운다(뒤로/새로고침 시 stale 스냅샷 재사용 방지).
  useEffect(() => {
    clearHandoff();
  }, [clearHandoff]);

  const channelHref = `/channel/${creatorId}`;

  function goToLive() {
    router.push(`/live/${creatorId}`);
  }

  // 직접 진입(핸드오프 없음 — 새로고침 포함): 안내 화면.
  if (!handoff) {
    return (
      <CenteredPanel
        tone="muted"
        icon={<Scissors className="size-8" aria-hidden />}
        title={CLIP_LABEL.directEntryTitle}
        description={CLIP_LABEL.directEntryDescription}
      >
        <Button className="rounded-xl font-bold" render={<Link href={channelHref} />}>
          {CLIP_LABEL.goToChannel}
        </Button>
      </CenteredPanel>
    );
  }

  if (status === "processing") {
    return (
      <CenteredPanel
        tone="brand"
        icon={<Loader2 className="size-8 animate-spin" aria-hidden />}
        title={CLIP_LABEL.processingTitle}
        description={CLIP_LABEL.processingDescription}
      >
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground rounded-xl"
          onClick={goToLive}
        >
          {CLIP_LABEL.backToLive}
        </Button>
      </CenteredPanel>
    );
  }

  if (status === "ready") {
    return (
      <CenteredPanel
        tone="brand"
        icon={<Check className="size-8" aria-hidden />}
        title={CLIP_LABEL.readyTitle}
        description={CLIP_LABEL.readyDescription}
      >
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1 rounded-xl font-bold"
            render={<Link href={`/clip/${readyClipId}`} />}
          >
            <Scissors aria-hidden />
            {CLIP_LABEL.viewClip}
          </Button>
          <Button variant="secondary" className="flex-1 rounded-xl" onClick={goToLive}>
            {CLIP_LABEL.backToLive}
          </Button>
        </div>
      </CenteredPanel>
    );
  }

  if (status === "failed") {
    return (
      <CenteredPanel
        tone="destructive"
        icon={<TriangleAlert className="size-8" aria-hidden />}
        title={CLIP_LABEL.failedTitle}
        description={CLIP_LABEL.failedDescription}
      >
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button className="flex-1 rounded-xl font-bold" onClick={reset}>
            {CLIP_LABEL.retry}
          </Button>
          <Button variant="secondary" className="flex-1 rounded-xl" onClick={goToLive}>
            {CLIP_LABEL.backToLive}
          </Button>
        </div>
      </CenteredPanel>
    );
  }

  // 기본: 편집 폼(idle·submitting).
  const isSubmitting = status === "submitting";

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-6 sm:py-10">
      <div className="bg-card border-border w-full max-w-3xl overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border/60 flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="bg-brand/10 text-brand flex size-9 items-center justify-center rounded-xl">
              <Scissors className="size-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-foreground text-base font-bold">{CLIP_LABEL.editorTitle}</h1>
              <p className="text-muted-foreground text-xs">{CLIP_LABEL.editorSubtitle}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={CLIP_LABEL.close}
            className="text-muted-foreground hover:text-foreground rounded-full"
            onClick={goToLive}
          >
            <X aria-hidden />
          </Button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <ClipCropSelector
                snapshotDataUrl={handoff.snapshotDataUrl}
                cropXFraction={cropXFraction}
                onCropXFractionChange={setCropXFraction}
              />
              <p className="text-muted-foreground text-xs">{CLIP_LABEL.cropGuide}</p>
            </div>
            <ClipVerticalPreview
              snapshotDataUrl={handoff.snapshotDataUrl}
              cropXFraction={cropXFraction}
              className="mx-auto w-40 sm:mx-0 sm:w-44"
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
              <span className="text-foreground text-sm font-medium">
                {CLIP_LABEL.durationLabel}
              </span>
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

          <Button
            type="button"
            size="lg"
            className="rounded-xl font-bold"
            disabled={isSubmitting}
            onClick={() => void createClip({ title, durationSeconds, cropXFraction })}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Scissors aria-hidden />
            )}
            {isSubmitting ? CLIP_LABEL.submitting : CLIP_LABEL.submit}
          </Button>
        </div>
      </div>
    </div>
  );
}

const TONE_CLASS = {
  brand: "bg-brand/10 text-brand",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
} as const;

interface CenteredPanelProps {
  tone: keyof typeof TONE_CLASS;
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}

function CenteredPanel({ tone, icon, title, description, children }: CenteredPanelProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="bg-card border-border flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-8 text-center shadow-sm">
        <span
          className={`flex size-16 items-center justify-center rounded-2xl ${TONE_CLASS[tone]}`}
        >
          {icon}
        </span>
        <div className="space-y-1">
          <p className="text-foreground text-base font-bold">{title}</p>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

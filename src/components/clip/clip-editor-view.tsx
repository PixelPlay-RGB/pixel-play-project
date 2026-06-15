"use client";
// 클립 에디터 카드 — 라이브 가위 버튼이 넘긴 스냅샷/필름스트림 위에서 크롭 위치·제목·길이를
// 정하고 생성한다. 생성 후엔 같은 카드 안에서 처리 중 → 완료/실패 단계를 보여준다.
// 풀페이지(직접 진입)와 모달(라이브 위 인터셉트) 양쪽에서 같은 카드로 쓰인다.

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Scissors, TriangleAlert, X } from "lucide-react";

import { ClipCropSelector } from "@/components/clip/clip-crop-selector";
import { ClipDurationTrimmer } from "@/components/clip/clip-duration-trimmer";
import { ClipVerticalPreview } from "@/components/clip/clip-vertical-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CLIP_DURATION_DEFAULT_SECONDS,
  CLIP_DURATION_MAX_SECONDS,
  CLIP_DURATION_MIN_SECONDS,
  CLIP_LABEL,
  CLIP_TITLE_MAX_LENGTH,
} from "@/constants/clip/clip";
import { cn } from "@/lib/utils";
import { useClipCreation } from "@/hooks/clip/use-clip-creation";
import { useClipEditorStore, type ClipEditorHandoff } from "@/stores/clip-editor";

const DEFAULT_CROP_X_FRACTION = 0.5;

interface Props {
  creatorId: string;
  // 닫기 동작 — 모달은 router.back(), 풀페이지는 라이브로 이동(미지정 시 기본값).
  onClose?: () => void;
}

const CARD_CLASS =
  "bg-card border-border flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-xl";

export function ClipEditorView({ creatorId, onClose }: Props) {
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

  const handleClose = onClose ?? (() => router.push(`/live/${creatorId}`));

  function renderHeader() {
    return (
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
          onClick={handleClose}
        >
          <X aria-hidden />
        </Button>
      </div>
    );
  }

  function renderBody() {
    if (!handoff) {
      return (
        <Panel
          tone="muted"
          icon={<Scissors className="size-8" aria-hidden />}
          title={CLIP_LABEL.directEntryTitle}
          description={CLIP_LABEL.directEntryDescription}
        >
          <Button className="rounded-xl font-bold" render={<Link href={`/channel/${creatorId}`} />}>
            {CLIP_LABEL.goToChannel}
          </Button>
        </Panel>
      );
    }

    if (status === "processing") {
      return (
        <Panel
          tone="brand"
          icon={<Loader2 className="size-8 animate-spin" aria-hidden />}
          title={CLIP_LABEL.processingTitle}
          description={CLIP_LABEL.processingDescription}
        >
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground rounded-xl"
            onClick={handleClose}
          >
            {CLIP_LABEL.backToLive}
          </Button>
        </Panel>
      );
    }

    if (status === "ready") {
      return (
        <Panel
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
            <Button variant="secondary" className="flex-1 rounded-xl" onClick={handleClose}>
              {CLIP_LABEL.backToLive}
            </Button>
          </div>
        </Panel>
      );
    }

    if (status === "failed") {
      return (
        <Panel
          tone="destructive"
          icon={<TriangleAlert className="size-8" aria-hidden />}
          title={CLIP_LABEL.failedTitle}
          description={CLIP_LABEL.failedDescription}
        >
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button className="flex-1 rounded-xl font-bold" onClick={reset}>
              {CLIP_LABEL.retry}
            </Button>
            <Button variant="secondary" className="flex-1 rounded-xl" onClick={handleClose}>
              {CLIP_LABEL.backToLive}
            </Button>
          </div>
        </Panel>
      );
    }

    // 기본: 편집 폼(idle·submitting).
    const isSubmitting = status === "submitting";
    const frames = handoff.frames.length > 0 ? handoff.frames : [];

    return (
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

        <ClipDurationTrimmer
          value={durationSeconds}
          min={CLIP_DURATION_MIN_SECONDS}
          max={CLIP_DURATION_MAX_SECONDS}
          frames={frames}
          onChange={setDurationSeconds}
        />

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
    );
  }

  return (
    <div className={CARD_CLASS}>
      {renderHeader()}
      {renderBody()}
    </div>
  );
}

const TONE_CLASS = {
  brand: "bg-brand/10 text-brand",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
} as const;

interface PanelProps {
  tone: keyof typeof TONE_CLASS;
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}

// 카드 본문 안에서 중앙 정렬되는 상태 패널(안내·처리 중·완료·실패).
function Panel({ tone, icon, title, description, children }: PanelProps) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <span
        className={cn("flex size-16 items-center justify-center rounded-2xl", TONE_CLASS[tone])}
      >
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-foreground text-base font-bold">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </div>
  );
}

"use client";
// 클립 에디터 — 라이브 가위가 넘긴 스냅샷/필름스트립 위에서 크롭 위치·구간(길이+위치)·제목을 정해
// 생성한다. 별도 창(팝업)으로 열려 라이브를 보면서 편집하며, 헤더·푸터 없이 풀블리드로 채운다.
// 생성 중에는 "창을 닫지 마세요" 안내와 함께 생성 버튼이 스피너로 처리 상태를 보여준다(창을 닫아도
// 클립 자체는 백그라운드에서 완성되지만, 완료 알림은 이 창에서만 뜬다).
// 폼 state·핸드오프 hydrate·생성/닫기 트리거는 useClipEditorForm 훅이 담당한다.

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, Scissors, TriangleAlert } from "lucide-react";

import { ClipCropSelector } from "@/components/clip/clip-crop-selector";
import { ClipDurationTrimmer } from "@/components/clip/clip-duration-trimmer";
import { ClipStatusPanel } from "@/components/clip/clip-status-panel";
import { ClipVerticalPreview } from "@/components/clip/clip-vertical-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CLIP_BUFFER_SECONDS,
  CLIP_DURATION_MAX_SECONDS,
  CLIP_DURATION_MIN_SECONDS,
  CLIP_LABEL,
  CLIP_TITLE_MAX_LENGTH,
} from "@/constants/clip/clip";
import { useClipEditorForm } from "@/hooks/clip/use-clip-editor-form";
import { openClipDetail } from "@/utils/clip/open-clip-detail";

interface Props {
  creatorId: string;
}

export function ClipEditorView({ creatorId }: Props) {
  const {
    router,
    handoff,
    hydrated,
    title,
    setTitle,
    durationSeconds,
    endOffsetSeconds,
    cropXFraction,
    setCropXFraction,
    status,
    readyClipId,
    isBusy,
    handleClose,
    handleDurationChange,
    handleSubmit,
  } = useClipEditorForm(creatorId);

  function renderBody() {
    // 핸드오프 읽기 전(1프레임)엔 중립 로딩 — SSR/클라 첫 렌더가 같아 하이드레이션 안전.
    if (!hydrated) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="text-muted-foreground size-7 animate-spin" aria-hidden />
        </div>
      );
    }

    if (!handoff) {
      return (
        <ClipStatusPanel
          tone="muted"
          icon={<Scissors className="size-8" aria-hidden />}
          title={CLIP_LABEL.directEntryTitle}
          description={CLIP_LABEL.directEntryDescription}
        >
          <Button
            className="rounded-xl font-bold"
            nativeButton={false}
            render={<Link href={`/channel/${creatorId}`} />}
          >
            {CLIP_LABEL.goToChannel}
          </Button>
        </ClipStatusPanel>
      );
    }

    if (status === "ready") {
      return (
        <ClipStatusPanel
          tone="brand"
          icon={<Check className="size-8" aria-hidden />}
          title={CLIP_LABEL.readyTitle}
          description={CLIP_LABEL.readyDescription}
        >
          <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1 rounded-xl font-bold"
              onClick={() => readyClipId && openClipDetail(readyClipId, router)}
            >
              <Scissors aria-hidden />
              {CLIP_LABEL.viewClip}
            </Button>
            <Button variant="secondary" className="flex-1 rounded-xl" onClick={handleClose}>
              {CLIP_LABEL.backToLive}
            </Button>
          </div>
        </ClipStatusPanel>
      );
    }

    // 편집 폼(idle·submitting·processing·failed 공용) — 처리 중에도 폼은 유지하고 버튼만 스피너로.
    const frames = handoff.frames;

    return (
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
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
            disabled={isBusy}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <ClipDurationTrimmer
            durationSeconds={durationSeconds}
            endOffsetSeconds={endOffsetSeconds}
            min={CLIP_DURATION_MIN_SECONDS}
            max={CLIP_DURATION_MAX_SECONDS}
            bufferSeconds={CLIP_BUFFER_SECONDS}
            frames={frames}
            onChange={handleDurationChange}
          />
          <p className="text-muted-foreground text-xs">{CLIP_LABEL.windowGuide}</p>
        </div>

        <div className="mt-auto flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {status === "failed" ? (
              <motion.p
                key="failed"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="text-destructive flex items-center gap-1.5 text-sm font-medium"
              >
                <TriangleAlert className="size-4 shrink-0" aria-hidden />
                {CLIP_LABEL.failedDescription}
              </motion.p>
            ) : isBusy ? (
              <motion.p
                key="busy"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="text-muted-foreground flex items-center gap-1.5 text-xs"
              >
                <TriangleAlert className="text-brand size-4 shrink-0" aria-hidden />
                {CLIP_LABEL.keepOpenHint}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <Button
            type="button"
            size="lg"
            className="rounded-xl font-bold"
            disabled={isBusy}
            onClick={handleSubmit}
          >
            {isBusy ? <Loader2 className="animate-spin" aria-hidden /> : <Scissors aria-hidden />}
            {isBusy
              ? CLIP_LABEL.creating
              : status === "failed"
                ? CLIP_LABEL.retry
                : CLIP_LABEL.submit}
          </Button>
        </div>
      </div>
    );
  }

  return <div className="bg-background flex h-full w-full flex-1 flex-col">{renderBody()}</div>;
}

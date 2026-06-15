"use client";
// 클립 에디터 — 라이브 가위가 넘긴 스냅샷/필름스트립 위에서 크롭 위치·구간(길이+위치)·제목을 정해
// 생성한다. 별도 창(팝업)으로 열려 라이브를 보면서 편집하며, 헤더·푸터 없이 풀블리드로 채운다.
// 생성 중에는 "창을 닫지 마세요" 안내와 함께 생성 버튼이 스피너로 처리 상태를 보여준다(창을 닫아도
// 클립 자체는 백그라운드에서 완성되지만, 완료 알림은 이 창에서만 뜬다).

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, Scissors, TriangleAlert } from "lucide-react";

import { ClipCropSelector } from "@/components/clip/clip-crop-selector";
import { ClipDurationTrimmer } from "@/components/clip/clip-duration-trimmer";
import { ClipVerticalPreview } from "@/components/clip/clip-vertical-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CLIP_BUFFER_SECONDS,
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
}

export function ClipEditorView({ creatorId }: Props) {
  const router = useRouter();

  // 핸드오프는 localStorage(persist)에 있어 클라에서만 읽는다(별도 창으로 넘어오기 때문).
  // SSR 불일치를 막으려 mount 후 effect에서 읽고, 읽자마자 store를 비운다(stale 재사용 방지).
  const [handoff, setLocalHandoff] = useState<ClipEditorHandoff | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [title, setTitle] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(CLIP_DURATION_DEFAULT_SECONDS);
  // 클립 시점(지금)으로부터 윈도우 끝까지의 거리. 0 = 직전 N초(기본).
  const [endOffsetSeconds, setEndOffsetSeconds] = useState(0);
  const [cropXFraction, setCropXFraction] = useState(DEFAULT_CROP_X_FRACTION);

  const { createClip, status, readyClipId } = useClipCreation(creatorId);

  useEffect(() => {
    const current = useClipEditorStore.getState().handoff;
    if (current && current.creatorId === creatorId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalHandoff(current);

      setTitle(current.defaultTitle);
    }
    useClipEditorStore.getState().clearHandoff();

    setHydrated(true);
  }, [creatorId]);

  // 닫기 — 별도 창(팝업)이면 창을 닫고, 아니면 라이브로 이동(직접 진입/하드로드).
  function handleClose() {
    if (typeof window !== "undefined" && window.opener && window.opener !== window) {
      window.close();
    } else {
      router.push(`/live/${creatorId}`);
    }
  }

  const isBusy = status === "submitting" || status === "processing";

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
        <Panel
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
          <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1 rounded-xl font-bold"
              nativeButton={false}
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
            onChange={(next) => {
              setDurationSeconds(next.durationSeconds);
              setEndOffsetSeconds(next.endOffsetSeconds);
            }}
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
            onClick={() =>
              void createClip({ title, durationSeconds, cropXFraction, endOffsetSeconds })
            }
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

// 풀블리드 안에서 가운데 정렬되는 상태 패널(안내·완료).
function Panel({ tone, icon, title, description, children }: PanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center"
    >
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
    </motion.div>
  );
}

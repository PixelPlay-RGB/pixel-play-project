"use client";
// 클립 에디터 폼 상태 — 핸드오프(스냅샷·필름스트립·기본 제목) hydrate, 크롭/트림/제목 입력
// state와 파생값(isBusy), 그리고 생성 요청·창 닫기 트리거를 한곳에서 관리한다. 핸드오프는
// localStorage(persist)에 있어 클라에서만 읽으며(별도 창으로 넘어오기 때문), SSR 불일치를
// 막으려 mount 후 effect에서 읽고 읽자마자 store를 비운다(stale 재사용 방지).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CLIP_DURATION_DEFAULT_SECONDS } from "@/constants/clip/clip";
import { useClipCreation } from "@/hooks/clip/use-clip-creation";
import { useClipEditorStore, type ClipEditorHandoff } from "@/stores/clip-editor";

const DEFAULT_CROP_X_FRACTION = 0.5;

export function useClipEditorForm(creatorId: string) {
  const router = useRouter();

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

  function handleDurationChange(next: { durationSeconds: number; endOffsetSeconds: number }) {
    setDurationSeconds(next.durationSeconds);
    setEndOffsetSeconds(next.endOffsetSeconds);
  }

  function handleSubmit() {
    void createClip({ title, durationSeconds, cropXFraction, endOffsetSeconds });
  }

  const isBusy = status === "submitting" || status === "processing";

  return {
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
  };
}

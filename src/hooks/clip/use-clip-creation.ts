"use client";
// 클립 생성 요청과 완료 추적을 담당합니다 — 생성 액션 호출 후 해당 행의 Realtime
// UPDATE(pending→ready/failed)를 구독해 상태를 갱신하고 토스트를 띄웁니다. 에디터 화면이
// status로 인라인 단계(요청 중·생성 중·완료·실패)를 그린다.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { createLiveClipAction, type CreateLiveClipInput } from "@/actions/clip/clip";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { CLIP_LABEL } from "@/constants/clip/clip";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { openClipDetail } from "@/utils/clip/open-clip-detail";
import { toastAppError, toastAppInfo, toastAppSuccess } from "@/utils/common/toast-message";

// idle: 입력 중 / submitting: 액션 전송 중 / processing: 워커 대기 / ready·failed: 결판.
export type ClipCreationStatus = "idle" | "submitting" | "processing" | "ready" | "failed";

// 워커 경로(클레임 15초 컷 + 추출·업로드)가 전부 막혀도 결판이 나는 안전망 시한.
const CLIP_RESULT_TIMEOUT_MS = 90_000;

export function useClipCreation(creatorId: string) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [status, setStatus] = useState<ClipCreationStatus>("idle");
  const [pendingClipId, setPendingClipId] = useState<string | null>(null);
  const [readyClipId, setReadyClipId] = useState<string | null>(null);

  async function createClip(input: CreateLiveClipInput): Promise<boolean> {
    if (status === "submitting" || status === "processing") return false;
    setStatus("submitting");
    try {
      const result = await createLiveClipAction(creatorId, input);

      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.clip.createFailed);
        // 검증·레이트리밋 실패는 입력 화면을 유지해 바로 다시 시도하게 한다.
        setStatus("idle");
        return false;
      }

      toastAppInfo(APP_MESSAGE_CODE.info.clip.processing);
      setPendingClipId(result.data.clipId);
      setStatus("processing");
      return true;
    } catch (error) {
      console.error("클립 생성 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.clip.createFailed);
      setStatus("idle");
      return false;
    }
  }

  // 본인 클립은 RLS("Clippers can read own live clips")로 상태 무관 조회·구독된다.
  useEffect(() => {
    if (!pendingClipId) return;

    const clipId = pendingClipId;
    let settled = false;

    const settle = (next: "ready" | "failed") => {
      if (settled) return;
      settled = true;

      if (next === "ready") {
        setReadyClipId(clipId);
        setStatus("ready");
        toastAppSuccess(APP_MESSAGE_CODE.success.clip.created, undefined, {
          label: CLIP_LABEL.viewClip,
          // 팝업이면 메인 탭에서 디테일을 열고 팝업을 닫는다(작은 팝업 안에서 보지 않게).
          onClick: () => openClipDetail(clipId, router),
        });
        // 시청 페이지 섹션·채널 탭 목록에 새 클립이 바로 보이게 한다.
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clip.channelAll(creatorId) });
      } else {
        setStatus("failed");
        toastAppError(APP_MESSAGE_CODE.error.clip.generationFailed);
      }

      setPendingClipId((current) => (current === clipId ? null : current));
    };

    const checkOnce = async () => {
      const { data } = await supabase
        .from("live_clip")
        .select("status")
        .eq("id", clipId)
        .maybeSingle<{ status: string }>();

      if (data?.status === "ready" || data?.status === "failed") {
        settle(data.status);
      }
    };

    const channel = supabase
      .channel(`live-clip-${clipId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_clip",
          filter: `id=eq.${clipId}`,
        },
        (payload) => {
          const next =
            payload.new && typeof payload.new === "object"
              ? (payload.new as { status?: string }).status
              : undefined;

          if (next === "ready" || next === "failed") {
            settle(next);
          }
        },
      )
      .subscribe((subscribeStatus) => {
        // 구독이 붙기 전에 워커가 이미 끝냈을 수 있다 — 단건 확인으로 레이스를 봉합한다.
        if (subscribeStatus === "SUBSCRIBED") {
          void checkOnce();
        }
      });

    const timeout = setTimeout(() => {
      // 안전망: Realtime이 끊겨도 시한 후 단건 확인으로 결판낸다(미결이면 실패로 안내).
      void checkOnce().then(() => {
        if (!settled) settle("failed");
      });
    }, CLIP_RESULT_TIMEOUT_MS);

    return () => {
      clearTimeout(timeout);
      void channel.unsubscribe();
    };
  }, [pendingClipId, creatorId, supabase, queryClient, router]);

  return {
    createClip,
    status,
    readyClipId,
  };
}

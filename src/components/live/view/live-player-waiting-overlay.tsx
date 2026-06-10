// 송출 대기 오버레이 — 방송은 시작됐지만 아직 송출(OBS) 영상이 도착하지 않은 동안 비디오 영역을 덮는다.
// <video>는 아래에서 계속 버퍼링하고, 이 오버레이는 첫 프레임이 도착하면(playbackState='playing') 사라진다.
// 비디오 영역은 테마와 무관하게 검은 배경이라 다크 변형 없이 단일 톤으로 둔다.

import { Radio } from "lucide-react";

import { LIVE_LABEL } from "@/constants/live/live";

export function LivePlayerWaitingOverlay() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="from-live/15 to-brand/15 absolute inset-0 flex flex-col items-center justify-center gap-3 bg-linear-to-br via-black/85 px-6 text-center"
    >
      <Radio className="text-live size-10 motion-safe:animate-pulse" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-base font-bold text-white">{LIVE_LABEL.streamWaitingTitle}</p>
        <p className="text-sm text-white/70">{LIVE_LABEL.streamWaitingDescription}</p>
      </div>
    </div>
  );
}

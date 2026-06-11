// 사이트 내 이동 시에도 라이브 시청을 잇는 활성 시청 세션 상태를 관리합니다.
// 시청 페이지(LiveView)가 세션을 시작/종료하고, 루트 영속 호스트(LiveMiniPlayerHost)가
// 미니플레이어 표시 파생과 시청자 presence를 소유해 페이지 수명과 무관하게 시청이 유지된다.

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface LiveWatchSession {
  creatorId: string;
  broadcastId: string;
  // 크리에이터별 재생 URL. 설정 미비 시 null — 세션은 유지하고 미니는 송출 대기 오버레이를 띄운다.
  hlsSrc: string | null;
}

interface LiveWatchSessionState {
  session: LiveWatchSession | null;
  startSession: (session: LiveWatchSession) => void;
  endSession: () => void;
}

export const useLiveWatchSessionStore = create<LiveWatchSessionState>()(
  devtools(
    (set) => ({
      session: null,
      startSession: (session) => set({ session }, false, "liveWatchSession/startSession"),
      endSession: () => set({ session: null }, false, "liveWatchSession/endSession"),
    }),
    {
      name: "LiveWatchSessionStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);

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
  // 시청 페이지에서 명시적으로 PIP(미니)로 전환한 상태. 페이지에 머물러도 미니를 띄우고
  // 원래 비디오 자리엔 안내를 표시한다(페이지 이탈 자동 미니 파생과 달리 사용자가 켠다).
  isPip: boolean;
  startSession: (session: LiveWatchSession) => void;
  endSession: () => void;
  setPip: (isPip: boolean) => void;
}

export const useLiveWatchSessionStore = create<LiveWatchSessionState>()(
  devtools(
    (set) => ({
      session: null,
      isPip: false,
      startSession: (session) => set({ session }, false, "liveWatchSession/startSession"),
      // 세션이 끝나면 PIP 상태도 함께 끈다 — 다음 세션이 PIP인 채로 부활하지 않게.
      endSession: () => set({ session: null, isPip: false }, false, "liveWatchSession/endSession"),
      setPip: (isPip) => set({ isPip }, false, "liveWatchSession/setPip"),
    }),
    {
      name: "LiveWatchSessionStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);

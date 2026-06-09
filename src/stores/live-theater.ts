// 라이브 시청 화면의 와이드(극장) 모드 상태를 관리합니다.
// 토글 버튼은 시청 화면(LiveView)에, 접히는 전역 사이드바는 LiveShell에 있어
// 둘이 형제 트리라 prop으로 못 잇기 때문에 store로 공유한다.

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface LiveTheaterState {
  isWideMode: boolean;
  setWideMode: (value: boolean) => void;
  toggleWideMode: () => void;
}

export const useLiveTheaterStore = create<LiveTheaterState>()(
  devtools(
    (set) => ({
      isWideMode: false,
      setWideMode: (value) => set({ isWideMode: value }, false, "liveTheater/setWideMode"),
      toggleWideMode: () =>
        set((state) => ({ isWideMode: !state.isWideMode }), false, "liveTheater/toggleWideMode"),
    }),
    {
      name: "LiveTheaterStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);

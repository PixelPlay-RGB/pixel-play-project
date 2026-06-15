// 라이브 시청 화면(가위 버튼)에서 잡은 프레임 스냅샷·기본 제목을 클립 에디터 라우트로
// 넘기기 위한 일회성 핸드오프 store. 라이브 페이지와 /clip/editor는 형제 라우트라 prop으로
// 못 잇는다. 스냅샷 data URL은 휘발성 — 새로고침으로 사라지면 에디터가 안내 화면으로 폴백한다.

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface ClipEditorHandoff {
  creatorId: string;
  // 가위 클릭 시점의 프레임(jpeg data URL). 캡처 실패 시 null — 크롭은 그래도 동작한다.
  snapshotDataUrl: string | null;
  // 제목 입력 기본값 = 방송 제목.
  defaultTitle: string;
}

interface ClipEditorState {
  handoff: ClipEditorHandoff | null;
  setHandoff: (handoff: ClipEditorHandoff) => void;
  clearHandoff: () => void;
}

export const useClipEditorStore = create<ClipEditorState>()(
  devtools(
    (set) => ({
      handoff: null,
      setHandoff: (handoff) => set({ handoff }, false, "clipEditor/setHandoff"),
      clearHandoff: () => set({ handoff: null }, false, "clipEditor/clearHandoff"),
    }),
    {
      name: "ClipEditorStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);

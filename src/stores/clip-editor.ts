// 라이브 시청 화면(가위 버튼)에서 잡은 프레임 스냅샷·필름스트립·기본 제목을 클립 에디터로
// 넘기기 위한 핸드오프 store. 에디터는 별도 창(window.open)으로 열려 라이브를 보면서 편집할 수
// 있어야 하므로, 같은 오리진의 다른 창으로 값을 넘기려면 localStorage(persist)가 필요하다.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ClipEditorHandoff {
  creatorId: string;
  // 가위 클릭 시점의 프레임(jpeg data URL). 캡처 실패 시 null — 크롭은 그래도 동작한다.
  snapshotDataUrl: string | null;
  // 지난 ~30초를 시킹하며 캡처한 필름스트립 프레임들(작은 jpeg). 비어 있으면 스냅샷 1장으로 폴백.
  frames: string[];
  // 제목 입력 기본값 = 방송 제목.
  defaultTitle: string;
}

interface ClipEditorState {
  handoff: ClipEditorHandoff | null;
  setHandoff: (handoff: ClipEditorHandoff) => void;
  clearHandoff: () => void;
}

export const useClipEditorStore = create<ClipEditorState>()(
  persist(
    (set) => ({
      handoff: null,
      setHandoff: (handoff) => set({ handoff }),
      clearHandoff: () => set({ handoff: null }),
    }),
    {
      name: "pixelplay-clip-editor-handoff",
      // 상태만 persist(액션 제외). 핸드오프는 에디터가 읽은 뒤 곧바로 비운다.
      partialize: (state) => ({ handoff: state.handoff }),
    },
  ),
);

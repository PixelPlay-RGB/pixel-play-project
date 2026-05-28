// 라이브 플레이어 하단 컨트롤 바를 렌더링합니다.

import { Maximize2, Settings, Volume2 } from "lucide-react";

export function LivePlayerControls() {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="음량 조절"
        className="text-white/80 transition-colors hover:text-white"
      >
        <Volume2 className="size-5" />
      </button>
      <button
        type="button"
        aria-label="화질 설정"
        className="text-white/80 transition-colors hover:text-white"
      >
        <Settings className="size-5" />
      </button>
      <button
        type="button"
        aria-label="전체화면"
        className="ml-auto text-white/80 transition-colors hover:text-white"
      >
        <Maximize2 className="size-5" />
      </button>
    </div>
  );
}

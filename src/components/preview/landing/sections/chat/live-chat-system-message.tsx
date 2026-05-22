// 랜딩 프리뷰 채팅 시스템 메시지를 렌더링합니다.
import type { ReactNode } from "react";

export function LiveChatSystemMessage({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground py-1 text-center text-[0.6875rem] font-semibold">
      {children}
    </p>
  );
}

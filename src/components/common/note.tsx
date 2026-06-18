// 본문 하단 보조 안내(정책·약관·도움말 등) 블록. 제목 + 여러 줄 설명을 묶는 재사용 컴포넌트.
// 우측 SideTipCard(브랜드 강조 팁)와 달리, 본문 흐름 안에 조용히 놓이는 회색 안내문에 쓴다.

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface NoteProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Note({ title, children, className }: NoteProps) {
  return (
    <section className={cn("text-muted-foreground text-sm leading-7", className)}>
      {title && <h2 className="text-foreground mb-2 font-black">{title}</h2>}
      {children}
    </section>
  );
}

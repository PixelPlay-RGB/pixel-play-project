// 채널 채팅 설정 섹션 카드를 렌더링합니다.

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function ChatSettingsCard({ title, description, children, className }: Props) {
  return (
    <section
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-5 rounded-xl border p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="space-y-2">
        <h2 className="text-foreground text-lg leading-7 font-extrabold">{title}</h2>
        <p className="text-muted-foreground max-w-3xl text-sm leading-6 text-pretty whitespace-pre-line">
          {description}
        </p>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

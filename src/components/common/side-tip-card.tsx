// 설정 화면 등에서 반복 사용하는 보조 안내(팁) 카드입니다.

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SideTipCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}

export function SideTipCard({ icon, title, description, children, className }: SideTipCardProps) {
  return (
    <aside
      className={cn(
        "side-tip-card text-card-foreground flex h-fit flex-col gap-5 rounded-xl border p-5",
        "w-full xl:w-120 xl:shrink-0",
        className,
      )}
    >
      <div className="bg-brand/10 text-brand flex size-10 items-center justify-center rounded-xl">
        {icon}
      </div>
      <div className="space-y-2">
        <h2 className="text-brand text-sm font-extrabold">{title}</h2>
        <p className="text-foreground/80 text-sm leading-6 text-pretty whitespace-pre-line">
          {description}
        </p>
      </div>
      {children && (
        <div className="border-brand/15 grid gap-3 border-t pt-4 text-sm">{children}</div>
      )}
    </aside>
  );
}

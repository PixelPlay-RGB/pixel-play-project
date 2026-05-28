// 채널 관리 화면에서 반복 사용하는 보조 안내 카드입니다.

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ChannelSideTipCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}

interface ChannelSideTipStepProps {
  number: string;
  title: string;
  description: string;
}

export function ChannelSideTipCard({
  icon,
  title,
  description,
  children,
  className,
}: ChannelSideTipCardProps) {
  return (
    <aside
      className={cn(
        "channel-side-tip-card text-card-foreground flex h-fit flex-col gap-5 rounded-xl border p-5",
        className,
      )}
    >
      <div className="bg-brand/10 text-brand flex size-10 items-center justify-center rounded-xl">
        {icon}
      </div>
      <div className="space-y-2">
        <h2 className="text-brand text-sm font-extrabold">{title}</h2>
        <p className="text-foreground/80 text-sm leading-6 text-pretty">{description}</p>
      </div>
      {children && (
        <div className="border-brand/15 grid gap-3 border-t pt-4 text-sm">{children}</div>
      )}
    </aside>
  );
}

export function ChannelSideTipStep({ number, title, description }: ChannelSideTipStepProps) {
  return (
    <div className="flex gap-3">
      <span className="bg-brand/10 text-brand flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
        {number}
      </span>
      <div className="min-w-0 space-y-1">
        <strong className="text-foreground block text-sm leading-5 text-pretty">{title}</strong>
        <p className="text-muted-foreground text-xs leading-5 text-pretty">{description}</p>
      </div>
    </div>
  );
}

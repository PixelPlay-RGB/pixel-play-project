// 채널 보안 설정의 라벨, 값, 액션 행을 렌더링합니다.
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SecurityFieldRow({
  label,
  value,
  action,
  className,
}: {
  label: string;
  value: string;
  action: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-muted/40 flex flex-col gap-4 rounded-xl border p-4",
        "lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <span className="text-muted-foreground text-xs font-semibold">{label}</span>
        <code className="text-foreground block font-mono text-sm leading-6 break-all select-all">
          {value}
        </code>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

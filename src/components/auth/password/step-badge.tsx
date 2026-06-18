// 비밀번호 변경 다이얼로그의 단계 배지(본인 확인 / 새 비밀번호)를 렌더링합니다.

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  active: boolean;
  completed?: boolean;
  label: string;
  className?: string;
}

export default function StepBadge({ active, completed = false, label, className }: Props) {
  return (
    <span
      className={cn(
        "flex h-8 items-center justify-center gap-1.5 rounded-lg border text-xs font-bold",
        active || completed
          ? "border-brand/30 bg-brand/10 text-brand"
          : "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      {label}
      {completed && (
        <span className="bg-brand text-brand-foreground flex size-4 items-center justify-center rounded-full">
          <Check className="size-3" />
        </span>
      )}
    </span>
  );
}

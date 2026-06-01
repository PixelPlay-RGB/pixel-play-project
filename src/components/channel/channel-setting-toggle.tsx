"use client";
// 채널 설정 화면에서 사용하는 공통 토글 행 컴포넌트입니다.

import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

interface Props {
  checked: boolean;
  description: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onChange: (checked: boolean) => void;
}

export default function ChannelSettingToggle({
  checked,
  description,
  icon: Icon,
  label,
  onChange,
}: Props) {
  return (
    <button
      type="button"
      className={cn(
        "border-border flex min-h-18 items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
        "hover:bg-muted/50",
      )}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="flex min-w-0 gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            checked ? "bg-brand text-white" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <strong className="text-sm">{label}</strong>
          <span className="text-muted-foreground text-xs">{description}</span>
        </span>
      </span>
      <span
        className={cn(
          "mt-1 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-brand" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "bg-background size-4 rounded-full transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}

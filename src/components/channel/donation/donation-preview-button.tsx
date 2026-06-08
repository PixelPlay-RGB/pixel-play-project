"use client";
// 후원 설정에서 알림음·TTS를 개별적으로 미리 들어보는 작은 버튼입니다.

import { Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onPreview: () => void;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}

export function DonationPreviewButton({ onPreview, disabled, ariaLabel, className }: Props) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onPreview}
      aria-label={ariaLabel}
      className={cn("h-9 shrink-0 rounded-xl px-3 font-semibold", className)}
    >
      <Volume2 className="size-3.5" />
      미리듣기
    </Button>
  );
}
